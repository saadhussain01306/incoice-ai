# InvoiceAI-mySchneider — Functional Helper Guide

A plain-English description of what every screen does, what the backend does
behind the scenes, and how the dashboard and the procurement portal stay in sync.

---

## 1. Product overview

Two applications share one backend:

| App | Purpose | Users |
|---|---|---|
| **InvoiceAI-mySchneider** (dashboard) | OCR + AI validation + auto-submission of vendor invoices | Schneider AP team, controllers |
| **InvoicePortal-mySchneider** (portal) | Authoritative procurement record of submitted invoices | Vendors, procurement, audit |

The dashboard is where invoices are **ingested, validated, and approved**.
The portal is where the **final accepted record** lives. Every approval in the
dashboard flows into the portal through the Portal Submission API (§ 6 of `API_SPEC.md`).

---

## 2. Invoice lifecycle (end-to-end)

```text
  ┌────────────┐   ┌──────────────┐   ┌────────────────┐   ┌──────────────────┐
  │  Ingest    │ → │  Extraction  │ → │  Validation    │ → │  Decision        │
  │ (email/    │   │  (OCR + AI)  │   │  (6 modules)   │   │  auto / review   │
  │  upload)   │   └──────────────┘   └────────────────┘   └────────┬─────────┘
  └────────────┘                                                    │
                                                                    ▼
                                       ┌─────────────────────────────────────┐
                                       │  Portal sync                        │
                                       │  POST /portal/submissions           │
                                       │  → InvoicePortal-mySchneider record │
                                       └─────────────────────────────────────┘
```

### 2.1 Ingest
- Email pipeline polls an inbox, downloads PDFs/images, calls
  `POST /invoices/upload-url`, uploads to S3, creates an invoice row.
- Manual upload calls the same upload-URL endpoint from the Settings/Upload screen.

### 2.2 Extraction
- Backend runs OCR (Textract / equivalent) then a domain LLM to map text → structured fields
  (`vendorName`, `invoiceNumber`, `gstNumber`, `lineItems`, `subtotal`, `taxRate`, …).
- Confidence score per field + an overall `confidenceScore` 0–1.
- Status moves `extracting` → next stage.

### 2.3 Validation (the engine)
Runs 6 modules and produces a per-module pass/warn/fail result.

| Module | Backend call | What it checks |
|---|---|---|
| PO Match | `GET /po/{poNumber}` | PO exists, vendor + currency + total within tolerance |
| GST Validation | `GET /gst/{gstin}` + `POST /gst/hsn-validate` | GSTIN active, HSN/SAC valid, rate consistent |
| Vendor Master | `GET /vendors` | Vendor exists and is approved |
| Duplicate Check | internal `invoice_hash` index | Same vendor + invoice# + date + total never accepted before |
| Tax Math | `POST /gst/tax-verify` | `subtotal × rate ≈ taxAmount`, totals reconcile within ₹1 |
| Line Items | PO line reconciliation | Qty × unit price ≈ amount; line maps to a PO line |

The engine combines these into `overallStatus`:
- All pass + confidence ≥ `autoSubmitThreshold` → `auto_submitted`
- Any fail / low confidence → `human_review`
- Portal returns failure → `submission_failed`

### 2.4 Decision
- **Auto path** — engine immediately calls `POST /portal/submissions` with
  `submissionType: "auto"`.
- **Human-in-loop path** — invoice surfaces in the **Review queue**. An AP
  reviewer fixes any field, then clicks *Approve* → frontend calls
  `POST /invoices/{id}/submit`, which internally posts to
  `POST /portal/submissions/{psuId}/human-in-loop` with the field overrides
  diff for full audit traceability.
- **Reject path** — `POST /invoices/{id}/reject` with a reason code; nothing
  is sent to the portal.

### 2.5 Portal sync
- Dashboard → Portal: `POST /portal/submissions` (queued).
- Portal → Dashboard: webhook `POST /api/public/webhooks/portal`
  (signature-verified HMAC) when accepted/rejected.
- The dashboard updates invoice status accordingly.

---

## 3. Dashboard screens (what each one does)

| Route | What user sees | Primary backend calls |
|---|---|---|
| `/` | KPIs (today's volume, auto-submit %, exceptions), trend chart | `GET /validate/summary`, `GET /invoices?limit=10` |
| `/queue` | List of invoices needing review, filters, bulk actions | `GET /invoices?status=human_review` |
| `/review/:id` | Field-by-field side-by-side: extracted vs portal/PO, editable | `GET /invoices/{id}`, `POST /invoices/{id}/submit`, `POST /invoices/{id}/reject` |
| `/validation` | Module-by-module pass/fail breakdown for an invoice or summary | `POST /validate/{id}`, `GET /validate/summary` |
| `/extraction` | OCR preview, confidence heatmap, re-run OCR | `GET /invoices/{id}/extraction-status`, `POST /invoices/{id}/reprocess` |
| `/submissions` | Outbound portal submissions log + retry | `GET /portal/submissions`, `POST /portal/submissions/{id}/retry` |
| `/audit` | Immutable activity feed, export to CSV | `GET /audit`, `POST /audit/export` |
| `/settings` | Thresholds, notifications, portal endpoint | `GET/PUT /settings` |
| `/portal` | **Reference view** of InvoicePortal-mySchneider (read-only mirror) | `GET /portal/records` |

> Analytics and System Health screens are temporarily disabled in the UI but
> their code remains in `src/routes/_app.analytics.tsx` and
> `src/routes/_app.health.tsx` for future re-enablement.

---

## 4. InvoicePortal-mySchneider (procurement side)

A simpler app whose only job is to be the **source of truth** of accepted invoices.

| Section | What it shows |
|---|---|
| Header | Schneider Electric branding, current module = Invoices |
| Stat cards | Total records, Accepted, Rejected/Pending |
| Records table | One row per invoice: Invoice #, PO #, Vendor, GSTIN, Date, Subtotal, Tax, Total, Status |
| Search | By invoice / vendor / PO / GSTIN |

Records arrive **exclusively** through the Portal Submission API. There is no
manual create form — that prevents the portal from diverging from the dashboard.

When the dashboard pushes an update (e.g. human-in-loop correction), the portal
updates the existing record in place and writes an audit entry.

---

## 5. Roles & permissions

| Role | Can do |
|---|---|
| `ap_reviewer` | Review queue, approve/reject, view audit |
| `ap_admin` | All of above + change thresholds + retry failed submissions |
| `controller` | Read-only dashboard + audit export |
| `portal_viewer` | Read-only `InvoicePortal-mySchneider` |

RLS on the backend enforces these — the frontend only hides buttons.

---

## 6. Behind-the-scenes infrastructure (for engineers)

- **DB:** Postgres. Tables: `invoices`, `invoice_events`, `validation_results`,
  `portal_submissions`, `vendors`, `purchase_orders`, `settings`.
- **OCR/LLM:** AWS Textract + GPT-class LLM via internal AI Gateway.
- **Queues:** SQS for OCR jobs, portal-sync jobs, webhook delivery.
- **Audit log:** append-only DynamoDB table + S3 cold archive after 90 days.
- **Portal sync worker:** consumes `portal_submissions.queued` rows, calls
  `InvoicePortal-mySchneider` REST API, updates status on response, schedules
  exponential-backoff retries on 5xx.
- **Webhook auth:** HMAC-SHA256 with shared `PORTAL_WEBHOOK_SECRET`.
- **Observability:** all `/v1/*` routes emit OpenTelemetry traces;
  validation modules emit per-module duration + outcome metrics.

---

## 7. Common operator playbooks

- **Vendor says "I uploaded but nothing happened"** — check `/extraction-status`,
  then `GET /invoices?search=<vendor>` filtered to last 24 h.
- **Portal shows REJECTED** — open `/submissions`, inspect webhook payload,
  fix data on the invoice, click *Resubmit* (calls `POST /invoices/{id}/submit`
  again, which generates a new `portalSubmissionId`).
- **Confidence too low across the board** — check OCR model version in Settings,
  consider lowering `autoSubmitThreshold` only temporarily.
- **Duplicate flagged incorrectly** — override in review screen with reason
  `duplicate_false_positive`; the override is logged and feeds the dedup
  training set.
