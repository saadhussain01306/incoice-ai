# Invoice INV-2026-1001 — Human Review (GST Rate Mismatch)

**Scenario:** Extracted GST rate differs from the vendor's configured rate in the portal. Routed for human review.

## Header
| Field | Value |
|---|---|
| Invoice Number | INV-2026-1001 |
| Vendor | Crestline Logistics |
| GSTIN | 27AABCU9601R1Z1 |
| Invoice Date | 2026-02-13 |
| PO Number | PO-2026-1001 |
| Currency | INR |
| Source | shared_drive |
| Priority | medium |
| Status | `human_review` |
| Assigned Reviewer | Priya S. |
| AI Confidence | 71.8% |

## Extracted Fields
| Field | Value |
|---|---|
| Subtotal | ₹28,200 |
| Tax Rate | **18%** ⚠️ |
| Tax Amount | ₹5,076 |
| **Total Amount** | **₹33,276** |

## Portal Record
| Field | Value |
|---|---|
| Subtotal | ₹28,000 |
| Tax Rate | **15%** |
| Tax Amount | ₹4,200 |
| **Total Amount** | **₹32,200** |

## Validation Result
- ✅ PO match
- ✅ GSTIN valid
- ❌ **GST rate mismatch** (extracted 18% vs portal 15%)
- ❌ **Total amount mismatch** (₹1,076 delta)
- ✅ No duplicate detected
- **Mismatches:** `GST rate mismatch`, `Total amount mismatch`

## AI Explanation
> Total differs by ₹1,076 due to GST rate mismatch and total amount mismatch.
> Extracted GST = 18%, portal configured GST = 15%. Recommend human verification.

## Audit Trail
1. `Ingestion Service` — Invoice received from shared_drive
2. `AI Extraction` — Extracted 9 fields · confidence 71.8%
3. `Validation Engine` — Routed for human review: GST rate mismatch
