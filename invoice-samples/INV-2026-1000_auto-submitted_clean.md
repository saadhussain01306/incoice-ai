# Invoice INV-2026-1000 — Auto-Submitted (Clean Match)

**Scenario:** Happy-path invoice. All extracted fields match the portal record. Auto-submitted by the agent without human review.

## Header
| Field | Value |
|---|---|
| Invoice Number | INV-2026-1000 |
| Vendor | ABC Manufacturing |
| GSTIN | 27AABCU9600R1Z0 |
| Invoice Date | 2026-02-14 |
| PO Number | PO-2026-1000 |
| Currency | INR |
| Source | email |
| Priority | low |
| Status | `auto_submitted` |
| Assigned Reviewer | — |
| AI Confidence | 92.4% |

## Extracted Fields (from OCR / LLM)
| Field | Value |
|---|---|
| Subtotal | ₹43,478 |
| Tax Rate | 15% |
| Tax Amount | ₹6,522 |
| **Total Amount** | **₹50,000** |

## Portal Record (source of truth)
| Field | Value |
|---|---|
| Subtotal | ₹43,478 |
| Tax Rate | 15% |
| Tax Amount | ₹6,522 |
| **Total Amount** | **₹50,000** |

## Validation Result
- ✅ PO match
- ✅ GSTIN valid
- ✅ Tax math correct (subtotal × 15% = tax amount)
- ✅ No duplicate detected
- ✅ Portal total matches extracted total
- **Mismatches:** none

## AI Explanation
> All fields matched portal records with 92.4% confidence. Auto-submission cleared by validation engine.

## Audit Trail
1. `Ingestion Service` — Invoice received from email
2. `AI Extraction` — Extracted 9 fields · confidence 92.4%
3. `Submission Agent` — Auto-submitted to vendor portal
