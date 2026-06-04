# Invoice INV-2026-1007 — Submission Failed (Portal 502)

**Scenario:** Invoice cleared validation but the vendor portal returned an error during auto-submission. Sitting in retry queue.

## Header
| Field | Value |
|---|---|
| Invoice Number | INV-2026-1007 |
| Vendor | Globex Industrial |
| GSTIN | 27AABCU9607R1Z7 |
| Invoice Date | 2026-02-12 |
| PO Number | PO-2026-1007 |
| Currency | INR |
| Source | email |
| Priority | low |
| Status | `submission_failed` |
| Assigned Reviewer | — |
| AI Confidence | 94.1% |

## Extracted Fields
| Field | Value |
|---|---|
| Subtotal | ₹52,174 |
| Tax Rate | 15% |
| Tax Amount | ₹7,826 |
| **Total Amount** | **₹60,000** |

## Portal Record
| Field | Value |
|---|---|
| Subtotal | ₹52,174 |
| Tax Rate | 15% |
| Tax Amount | ₹7,826 |
| **Total Amount** | **₹60,000** |

## Validation Result
- ✅ PO match
- ✅ GSTIN valid
- ✅ Tax math correct
- ✅ No duplicate detected
- ✅ Portal total matches extracted total
- ❌ **Submission failed** — vendor portal returned HTTP 502
- **Mismatches:** none (data is clean — pure infra failure)

## AI Explanation
> All fields matched portal records with 94.1% confidence. Submission attempt failed at portal layer; queued for retry by Submission Agent.

## Audit Trail
1. `Ingestion Service` — Invoice received from email
2. `AI Extraction` — Extracted 9 fields · confidence 94.1%
3. `Submission Agent` — Submission failed — portal returned 502
