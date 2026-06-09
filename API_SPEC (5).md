# InvoiceAI-mySchneider — Backend API Specification (v2)

> Branded for **Schneider Electric**. Consumed by `InvoiceAI-mySchneider` (dashboard) and
> `InvoicePortal-mySchneider` (procurement portal).
>
> **Base URL (prod):** `https://api.invoiceai.myschneider.com/v1`
> **Base URL (staging):** `https://api.staging.invoiceai.myschneider.com/v1`
> **Auth:** `Authorization: Bearer <JWT>` on all endpoints except `/auth/*` and `/api/public/*` webhooks.
> **Content-Type:** `application/json` unless noted.
> **Error envelope:**
> ```json
> { "error": { "code": "VALIDATION_FAILED", "message": "Invoice number missing", "details": {} } }
> ```

---

## 1. Auth

### POST /auth/login
Request:
```json
{ "email": "ap.user@se.com", "password": "•••" }
```
Response 200:
```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "user": { "id": "usr_01", "name": "Priya N.", "email": "ap.user@se.com", "role": "ap_reviewer" }
}
```

### POST /auth/refresh
Request: `{ "refreshToken": "..." }` → Response: `{ "accessToken": "..." }`

### POST /auth/logout
Request: `{}` → Response 204.

---

## 2. Invoices

### GET /invoices
Query params: `status` (`extracting|human_review|auto_submitted|submission_failed|rejected`),
`priority` (`high|medium|low`), `search`, `from`, `to`, `page`, `pageSize`.

Response 200:
```json
{
  "items": [
    {
      "id": "INV-2026-1000",
      "vendorName": "ACME Industrial Pvt Ltd",
      "invoiceNumber": "ACM/2026/0421",
      "invoiceDate": "2026-05-14",
      "totalAmount": 184500,
      "currency": "INR",
      "status": "auto_submitted",
      "priority": "low",
      "source": "email",
      "confidenceScore": 0.97,
      "createdAt": "2026-05-14T08:11:00Z"
    }
  ],
  "pagination": { "page": 1, "pageSize": 25, "total": 142 }
}
```

### GET /invoices/{invoiceId}
Returns full invoice including `extraction`, `portal`, `validation`, `auditTrail`.

### POST /invoices/upload-url
Request: `{ "filename": "invoice.pdf", "mime": "application/pdf" }`
Response: `{ "uploadUrl": "https://s3...", "objectKey": "uploads/2026/...", "invoiceId": "INV-..." }`

### POST /invoices/{invoiceId}/submit
Manual submit after human review. Triggers portal sync (§ 6).
Request: `{ "overrides": { "taxRate": 18, "totalAmount": 184500 }, "notes": "Vendor confirmed via email." }`
Response: `{ "id": "INV-...", "status": "auto_submitted", "portalSubmissionId": "PSU-..." }`

### POST /invoices/{invoiceId}/reject
Request: `{ "reasonCode": "duplicate", "notes": "Same as INV-2026-0998" }` → `{ "status": "rejected" }`

### POST /invoices/{invoiceId}/reprocess
Re-runs OCR + validation. Response: `{ "status": "extracting" }`

### GET /invoices/{invoiceId}/extraction-status
SSE/poll endpoint: `{ "stage": "ocr|fields|validation|portal_sync", "progress": 0.62 }`

---

## 3. Validation Engine

### POST /validate/{invoiceId}
Runs all modules (PO match, GST, vendor master, duplicates, tax math, line items).
Response:
```json
{
  "invoiceId": "INV-2026-1001",
  "overallStatus": "human_review",
  "modules": {
    "poMatch":       { "status": "pass", "details": { "poNumber": "PO-2026-1001" } },
    "gstValidation": { "status": "fail", "details": { "expectedRate": 18, "extractedRate": 12 } },
    "vendorMaster":  { "status": "pass", "details": { "vendorId": "VND-440" } },
    "duplicateCheck":{ "status": "pass" },
    "taxMath":       { "status": "warn", "details": { "deltaInr": 12 } },
    "lineItems":     { "status": "pass" }
  },
  "validatedAt": "2026-06-09T10:14:22Z"
}
```

### GET /validate/summary?from=2026-05-01&to=2026-05-31
Returns counts/percentages by module status for the dashboard tiles.

---

## 4. PO / Procurement

### GET /po/{poNumber}
Response: `{ "poNumber": "PO-2026-1001", "vendorId": "VND-440", "currency": "INR", "lines": [...], "totalAmount": 184500, "status": "open" }`

### POST /po/{poNumber}/reconcile
Request: `{ "invoiceId": "INV-2026-1001" }` → returns 3-way match diff.

---

## 5. GST / Tax / Vendor Master

- `GET /gst/{gstin}` → `{ "gstin": "...", "legalName": "...", "status": "active" }`
- `POST /gst/hsn-validate` → `{ "hsn": "8517", "applicableRates": [12, 18] }`
- `POST /gst/tax-verify` → request: `{ "subtotal": 156356, "rate": 18, "amount": 28144 }` → `{ "match": true }`
- `GET /vendors?gstin=...&name=...` → vendor master records.

---

## 6. Portal Submission (NEW — Dashboard ↔ InvoicePortal-mySchneider)

This is the bridge that pushes **auto-submitted** and **human-in-loop reviewed** invoice data
from the dashboard into `InvoicePortal-mySchneider`.

### POST /portal/submissions
Pushes one invoice into the procurement portal.
Request:
```json
{
  "invoiceId": "INV-2026-1000",
  "submissionType": "auto",
  "reviewedBy": null,
  "payload": {
    "invoiceNumber": "ACM/2026/0421",
    "vendorName": "ACME Industrial Pvt Ltd",
    "vendorId": "VND-440",
    "gstNumber": "29AABCA1234A1Z5",
    "poNumber": "PO-2026-1000",
    "invoiceDate": "2026-05-14",
    "subtotal": 156356,
    "taxRate": 18,
    "taxAmount": 28144,
    "totalAmount": 184500,
    "currency": "INR",
    "lineItems": [
      { "description": "Contactor LC1D32", "hsn": "8536", "qty": 20, "unitPrice": 4250, "amount": 85000 }
    ]
  },
  "metadata": {
    "confidenceScore": 0.97,
    "validationSnapshot": { "overallStatus": "auto_submitted", "modulesPassed": 6 },
    "source": "email"
  }
}
```

`submissionType` is `"auto"` for engine-cleared invoices, or `"human_in_loop"` when an AP
reviewer approved the invoice (`reviewedBy` then contains the user id and notes).

Response 202:
```json
{
  "portalSubmissionId": "PSU-2026-00198",
  "status": "queued",
  "portalRecordUrl": "https://portal.invoiceai.myschneider.com/portal/records/PSU-2026-00198"
}
```

### POST /portal/submissions/{psuId}/human-in-loop
Used when an AP reviewer corrects a flagged invoice and approves it. Mirrors the same
payload shape as `POST /portal/submissions` but additionally records the diff applied during
review:
```json
{
  "reviewedBy": "usr_01",
  "reviewedAt": "2026-06-09T10:14:22Z",
  "reviewNotes": "Corrected GST rate from 12% to 18% after vendor confirmation.",
  "fieldOverrides": [
    { "field": "taxRate",    "from": 12,    "to": 18 },
    { "field": "taxAmount",  "from": 18762, "to": 28144 },
    { "field": "totalAmount","from": 175118,"to": 184500 }
  ]
}
```
Response 200: updated portal record.

### GET /portal/submissions/{psuId}
Poll status. Response:
```json
{ "id": "PSU-2026-00198", "status": "accepted", "portalReference": "ACM/2026/0421", "acceptedAt": "2026-06-09T10:14:30Z" }
```

### GET /portal/records
Lists records as displayed in `InvoicePortal-mySchneider`. Same shape as `/invoices` but
authoritative from the portal side.

### POST /api/public/webhooks/portal  *(no auth — signature verified)*
Inbound from `InvoicePortal-mySchneider` confirming acceptance/rejection.
Headers: `X-Portal-Signature: hmac-sha256=...`
Body:
```json
{
  "portalSubmissionId": "PSU-2026-00198",
  "event": "accepted",
  "portalReference": "ACM/2026/0421",
  "timestamp": "2026-06-09T10:14:30Z"
}
```

---

## 7. Audit

### GET /audit?cursor=&limit=50&invoiceId=
Response:
```json
{
  "items": [
    { "id": "evt_01", "ts": "2026-06-09T10:14:22Z", "actor": "system", "action": "validation.completed",
      "invoiceId": "INV-2026-1001", "details": { "overallStatus": "human_review" } }
  ],
  "nextCursor": "..."
}
```

### POST /audit/export
Request: `{ "from": "2026-05-01", "to": "2026-05-31", "format": "csv" }` → `{ "downloadUrl": "https://..." }`

---

## 8. Settings

### GET /settings
### PUT /settings
Body:
```json
{
  "autoSubmitThreshold": 0.95,
  "humanReviewThreshold": 0.80,
  "notifications": { "email": true, "slack": false },
  "portal": {
    "endpoint": "https://portal.invoiceai.myschneider.com",
    "syncMode": "realtime"
  }
}
```

---

## 9. Reference enums

| Enum | Values |
|---|---|
| `InvoiceStatus` | `extracting`, `human_review`, `auto_submitted`, `submission_failed`, `rejected` |
| `Priority` | `high`, `medium`, `low` |
| `Source` | `email`, `upload`, `api`, `edi` |
| `ReasonCode` | `duplicate`, `po_mismatch`, `gst_mismatch`, `vendor_not_found`, `tax_math`, `other` |
| `SubmissionType` | `auto`, `human_in_loop` |
| `PortalEvent` | `queued`, `accepted`, `rejected`, `failed` |

---

## 10. Pagination & rate limits

- Cursor pagination on `/audit`, `/portal/submissions`, `/invoices/{id}/events`.
- Offset pagination (`page`, `pageSize`, max 100) on tables.
- Default rate limit: **120 req/min/user**, **600 req/min/service token**.
