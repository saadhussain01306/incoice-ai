# Invoice INV-2026-1004 — Human Review (High Priority · Possible Duplicate)

**Scenario:** Large-amount invoice flagged with possible duplicate plus a total mismatch. High-priority review queue.

## Header
| Field | Value |
|---|---|
| Invoice Number | INV-2026-1004 |
| Vendor | Orbit Cloud Services |
| GSTIN | 27AABCU9604R1Z4 |
| Invoice Date | 2026-02-13 |
| PO Number | PO-2026-1004 |
| Currency | INR |
| Source | shared_drive |
| Priority | **high** 🔥 |
| Status | `human_review` |
| Assigned Reviewer | Aisha K. |
| AI Confidence | 68.2% |

## Extracted Fields
| Field | Value |
|---|---|
| Subtotal | ₹74,783 |
| Tax Rate | 18% |
| Tax Amount | ₹13,461 |
| **Total Amount** | **₹86,000** |

## Portal Record
| Field | Value |
|---|---|
| Subtotal | ₹74,200 |
| Tax Rate | 15% |
| Tax Amount | ₹11,130 |
| **Total Amount** | **₹85,330** |

## Validation Result
- ✅ PO match
- ✅ GSTIN valid
- ❌ GST rate mismatch (18% vs 15%)
- ❌ Total amount mismatch (₹670 delta)
- ⚠️ **Possible duplicate invoice** detected (similar invoice from same vendor in past 30 days)
- **Mismatches:** `GST rate mismatch`, `Total amount mismatch`, `Possible duplicate invoice`

## AI Explanation
> Total differs by ₹670 due to gst rate mismatch, total amount mismatch, possible duplicate invoice.
> Extracted GST = 18%, portal configured GST = 15%. Recommend human verification.

## Audit Trail
1. `Ingestion Service` — Invoice received from shared_drive
2. `AI Extraction` — Extracted 9 fields · confidence 68.2%
3. `Validation Engine` — Routed for human review: Possible duplicate invoice
