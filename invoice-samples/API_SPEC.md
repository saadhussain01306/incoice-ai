# Invoice AI — Backend API Specification

Base URL (suggested):
- Prod: `https://api.invoice-ai.example.com/v1`
- Staging: `https://api.staging.invoice-ai.example.com/v1`

Auth: `Authorization: Bearer <JWT>` on every request (except `/auth/*` and public webhooks).
Content-Type: `application/json` unless noted. Timestamps: ISO-8601 UTC.

Standard error envelope:
```json
{ "error": { "code": "VALIDATION_FAILED", "message": "Invoice number missing", "details": {} } }
```

---

## 1. Invoices

### 1.1 List invoices
`GET /v1/invoices?status=human_review&priority=high&page=1&pageSize=25&search=ACME`

Response:
```json
{
  "page": 1,
  "pageSize": 25,
  "total": 482,
  "items": [
    {
      "id": "inv_01HXY...",
      "vendor": "Acme Industries Pvt Ltd",
      "amount": 184250.50,
      "portalAmount": 184250.50,
      "uploadedAt": "2026-06-04T08:12:33Z",
      "source": "email",
      "status": "human_review",
      "confidence": 0.873,
      "priority": "high",
      "assignedTo": "user_abc",
      "reason": "PO balance mismatch"
    }
  ]
}
```

### 1.2 Get invoice (full)
`GET /v1/invoices/{invoiceId}`

Response:
```json
{
  "id": "inv_01HXY...",
  "vendor": "Acme Industries Pvt Ltd",
  "amount": 184250.50,
  "portalAmount": 184250.50,
  "uploadedAt": "2026-06-04T08:12:33Z",
  "source": "email",
  "status": "human_review",
  "confidence": 0.873,
  "priority": "high",
  "extracted": {
    "invoiceNumber": "ACM/2026/0421",
    "vendorName": "Acme Industries Pvt Ltd",
    "gstNumber": "29ABCDE1234F1Z5",
    "invoiceDate": "2026-05-30",
    "currency": "INR",
    "subtotal": 156144.49,
    "taxRate": 18,
    "taxAmount": 28106.01,
    "totalAmount": 184250.50
  },
  "portal": { "...same shape as extracted...": true },
  "mismatches": ["taxAmount", "lineItem.3.quantity"],
  "aiExplanation": "PO PO-44821 has remaining balance 120000; invoice exceeds balance by 64250.",
  "documentUrl": "https://s3.../inv_01HXY.pdf",
  "pages": 3
}
```

### 1.3 Upload invoices (presigned URL flow)
**Step A** — request presigned URLs:
`POST /v1/invoices/upload-url`
```json
{
  "files": [
    { "filename": "acme-may.pdf", "mimeType": "application/pdf", "sizeBytes": 482113 }
  ]
}
```
Response:
```json
{
  "uploads": [
    {
      "uploadId": "upl_01HXY...",
      "s3Key": "incoming/2026/06/upl_01HXY.pdf",
      "presignedUrl": "https://s3.ap-south-1.amazonaws.com/invoice-ai/...&X-Amz-Signature=...",
      "expiresAt": "2026-06-04T08:30:00Z"
    }
  ]
}
```
**Step B** — client PUTs the file directly to `presignedUrl`.

**Step C** — notify ingestion:
`POST /v1/invoices/ingest`
```json
{ "uploadIds": ["upl_01HXY..."], "source": "manual_upload" }
```
Response:
```json
{ "invoices": [{ "id": "inv_01HXY...", "status": "extracting", "executionArn": "arn:aws:states:..." }] }
```

### 1.4 Force submit to portal
`POST /v1/invoices/{invoiceId}/submit`
```json
{ "portal": "sap_ariba", "credentialsRef": "vault://ariba/acme", "dryRun": false }
```
Response:
```json
{ "submissionId": "sub_01HXY...", "status": "queued", "etaSeconds": 45 }
```

### 1.5 Override reviewer corrections
`POST /v1/invoices/{invoiceId}/override`
```json
{
  "fields": {
    "taxAmount": 28106.01,
    "totalAmount": 184250.50,
    "lineItems": [
      { "lineNo": 3, "quantity": 12, "rate": 4500, "amount": 54000 }
    ]
  },
  "reviewer": "user_abc",
  "reasonCode": "OCR_TAX_ROUND",
  "notes": "Vendor rounded tax to nearest rupee."
}
```
Response: `204 No Content`

### 1.6 Reject invoice
`POST /v1/invoices/{invoiceId}/reject`
```json
{ "reasonCode": "DUPLICATE", "notes": "Already paid under inv_01HX0..." }
```
Response: `{ "status": "rejected" }`

### 1.7 Reprocess (re-run extraction)
`POST /v1/invoices/{invoiceId}/reprocess`
```json
{ "model": "claude-3.5-sonnet", "reason": "Low confidence on tax block" }
```
Response: `{ "executionArn": "arn:aws:states:...", "status": "extracting" }`

### 1.8 Extraction status (poll)
`GET /v1/invoices/{invoiceId}/extraction`

Response:
```json
{
  "invoiceId": "inv_01HXY...",
  "stepFunctionStatus": "RUNNING",
  "stages": [
    { "name": "s3_ingest",    "status": "SUCCEEDED", "ms": 312 },
    { "name": "textract_ocr", "status": "SUCCEEDED", "ms": 4180 },
    { "name": "bedrock_extract", "status": "RUNNING" },
    { "name": "validation",   "status": "PENDING" }
  ],
  "confidence": null
}
```

---

## 2. Validation

### 2.1 Run validation
`POST /v1/validate/{invoiceId}`

Response:
```json
{
  "invoiceId": "inv_01HXY...",
  "overall": "review",
  "riskScore": 62,
  "riskLevel": "medium",
  "routing": "human_review",
  "modules": {
    "po": { "status": "fail", "poNumber": "PO-44821", "poStatus": "open",
            "poTotal": 500000, "billedToDate": 380000, "remaining": 120000,
            "invoiceExceedsBy": 64250.50 },
    "receiving": { "status": "warn", "grnNumber": "GRN-9981", "grnDate": "2026-05-28",
                   "qtyReceived": 10, "qtyInvoiced": 12 },
    "tax": { "status": "ok", "regime": "intrastate",
             "components": { "cgst": 14053.01, "sgst": 14053.00, "igst": 0 },
             "hsnValid": true, "gstinActive": true },
    "duplicate": { "status": "ok", "nearestMatchScore": 0.21 },
    "vendor": { "status": "ok", "approvedSupplier": true, "paymentTermsDays": 30 },
    "confidence": { "ocr": 0.94, "extraction": 0.91, "validation": 0.72,
                    "vendorHistory": 0.88, "crossField": 0.81, "portalMatch": 0.95,
                    "composite": 0.873 }
  }
}
```

### 2.2 Validation summary (dashboard)
`GET /v1/validate/summary?from=2026-06-01&to=2026-06-04`

Response:
```json
{
  "totalProcessed": 12487,
  "autoSubmitted": 10240,
  "humanReview": 1812,
  "failed": 435,
  "poFailures": 122,
  "receivingWarnings": 318,
  "autoSubmitEligible": 9420,
  "highRiskCount": 87
}
```

---

## 3. PO / Procurement (proxy to ERP)

### 3.1 Lookup PO
`GET /v1/po/{poNumber}`
```json
{
  "poNumber": "PO-44821",
  "vendorId": "vend_8821",
  "vendorName": "Acme Industries Pvt Ltd",
  "status": "open",
  "currency": "INR",
  "total": 500000,
  "billedToDate": 380000,
  "remaining": 120000,
  "lines": [
    { "lineNo": 1, "sku": "SKU-A1", "description": "Hex bolt M8", "qty": 1000,
      "rate": 25, "uom": "EA", "billedQty": 800, "remainingQty": 200 }
  ],
  "grns": [
    { "grnNumber": "GRN-9981", "date": "2026-05-28",
      "lines": [{ "lineNo": 1, "qty": 200 }] }
  ]
}
```

### 3.2 Reconcile invoice ↔ PO
`POST /v1/po/{poNumber}/reconcile`
```json
{ "invoiceId": "inv_01HXY..." }
```
Response: same shape as `modules.po` in 2.1, plus per-line deltas.

---

## 4. GST / Tax APIs

### 4.1 GSTIN status
`GET /v1/tax/gstin/{gstin}`
```json
{
  "gstin": "29ABCDE1234F1Z5",
  "legalName": "Acme Industries Private Limited",
  "tradeName": "Acme Industries",
  "status": "Active",
  "stateCode": "29",
  "registrationDate": "2017-07-01",
  "lastVerifiedAt": "2026-06-04T08:00:00Z"
}
```

### 4.2 HSN/SAC validation
`POST /v1/tax/hsn/validate`
```json
{ "codes": ["73181500", "998314"] }
```
Response:
```json
{ "results": [
  { "code": "73181500", "valid": true, "description": "Threaded fasteners", "gstRate": 18 },
  { "code": "998314",   "valid": true, "description": "IT consulting",      "gstRate": 18 }
]}
```

### 4.3 Tax math verification
`POST /v1/tax/verify`
```json
{
  "supplierStateCode": "29",
  "buyerStateCode": "27",
  "lines": [{ "amount": 156144.49, "hsn": "73181500", "rate": 18 }]
}
```
Response:
```json
{
  "regime": "interstate",
  "expected": { "cgst": 0, "sgst": 0, "igst": 28106.01 },
  "match": true
}
```

---

## 5. Vendor Master

### 5.1 Lookup vendor by GSTIN/name
`GET /v1/vendors?gstin=29ABCDE1234F1Z5`
```json
{
  "items": [{
    "vendorId": "vend_8821",
    "name": "Acme Industries Pvt Ltd",
    "gstin": "29ABCDE1234F1Z5",
    "approvedSupplier": true,
    "paymentTerms": "Net 30",
    "bankAccount": { "ifsc": "HDFC0001234", "accountLast4": "5821" },
    "riskFlags": [],
    "totalInvoices": 184,
    "avgConfidence": 0.91
  }]
}
```

---

## 6. Portal Auto-Submission (Playwright on ECS Fargate)

### 6.1 Trigger submission
`POST /v1/portal/submissions`
```json
{
  "invoiceId": "inv_01HXY...",
  "portal": "sap_ariba",
  "credentialsRef": "vault://ariba/acme",
  "fields": { "invoiceNumber": "ACM/2026/0421", "totalAmount": 184250.50 },
  "attachments": ["s3://invoice-ai/incoming/2026/06/upl_01HXY.pdf"]
}
```
Response: `{ "submissionId": "sub_01HXY...", "taskArn": "arn:aws:ecs:...", "status": "running" }`

### 6.2 Poll status
`GET /v1/portal/submissions/{submissionId}`
```json
{
  "submissionId": "sub_01HXY...",
  "status": "succeeded",
  "portalRef": "ARIBA-INV-77321",
  "screenshots": ["s3://invoice-ai/runs/sub_01HXY/step-1.png"],
  "log": "s3://invoice-ai/runs/sub_01HXY/playwright.log",
  "completedAt": "2026-06-04T08:15:11Z"
}
```

### 6.3 Submission webhook (portal → us)
`POST /api/public/webhooks/portal`  (HMAC `x-webhook-signature`)
```json
{
  "submissionId": "sub_01HXY...",
  "portalRef": "ARIBA-INV-77321",
  "status": "accepted",
  "occurredAt": "2026-06-04T08:15:11Z"
}
```

---

## 7. Audit Trail (DynamoDB)

### 7.1 List
`GET /v1/audit?invoiceId=inv_01HXY...&from=2026-06-01&cursor=eyJ...`
```json
{
  "items": [
    { "id": "evt_01HXY...", "invoiceId": "inv_01HXY...",
      "actor": "system:bedrock", "action": "extraction.completed",
      "timestamp": "2026-06-04T08:12:51Z", "status": "success",
      "metadata": { "model": "claude-3.5-sonnet", "confidence": 0.873 } }
  ],
  "nextCursor": "eyJ..."
}
```

### 7.2 Export
`POST /v1/audit/export`
```json
{ "from": "2026-05-01", "to": "2026-06-04", "format": "csv" }
```
Response: `{ "downloadUrl": "https://s3.../audit-2026-06.csv", "expiresAt": "..." }`

---

## 8. Analytics

`GET /v1/analytics/summary?range=30d`
```json
{
  "processed": 12487,
  "autoRate": 0.82,
  "flagged": 211,
  "avgConfidence": 0.913,
  "throughputPerDay": [{ "date": "2026-06-03", "count": 412 }],
  "topRejectionReasons": [
    { "code": "PO_BALANCE_EXCEEDED", "count": 64 },
    { "code": "GSTIN_INACTIVE", "count": 23 }
  ]
}
```

---

## 9. Settings (confidence thresholds, toggles)

`GET /v1/settings` / `PUT /v1/settings`
```json
{
  "thresholds": { "autoSubmit": 0.92, "humanReview": 0.75 },
  "toggles": {
    "duplicateDetection": true,
    "gstinLiveCheck": true,
    "portalAutoSubmit": true,
    "slackAlerts": false
  },
  "notifications": { "email": ["ap@acme.com"], "slackWebhookRef": "vault://slack/ap" }
}
```

---

## 10. Reference enums

- `InvoiceStatus`: `extracting | validating | auto_submitted | human_review | submission_failed | pending_retry`
- `Source`: `email | shared_drive | manual_upload`
- `Priority`: `low | medium | high`
- `ReasonCode` (override/reject): `OCR_TAX_ROUND | DUPLICATE | PO_BALANCE_EXCEEDED | GSTIN_INACTIVE | VENDOR_BLOCKED | HSN_MISMATCH | QTY_MISMATCH | OTHER`
- `Portal`: `sap_ariba | coupa | oracle_fusion | tally | custom`

---

## 11. Pagination & filtering conventions

- Cursor pagination on append-only feeds (`audit`, `submissions`): `?cursor=&limit=`
- Offset pagination on tables (`invoices`, `vendors`): `?page=&pageSize=`
- Filters use exact query params (`status=`, `priority=`, `vendorId=`); free text via `search=`
- Sort: `?sort=-uploadedAt` (prefix `-` for desc)
