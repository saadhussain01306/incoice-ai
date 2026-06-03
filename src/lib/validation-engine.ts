import type { Invoice } from "@/types/invoice";

// =====================================================================
// Enterprise validation engine — derives PO, line items, receiving, tax,
// amount, duplicate, vendor, date, confidence, timeline, risk & routing
// payloads deterministically from a base Invoice.
//
// All numeric outputs are derived from the invoice id hash so they remain
// stable across SSR and client renders (no Date.now / Math.random).
//
// TODO(backend): Replace this synthetic derivation with live data from:
//   - ERP / Procurement API   (PO, line items, GR)
//   - Vendor Master API       (vendor approval, GSTIN registry)
//   - GST Validation API      (GSTIN format + active status)
//   - DynamoDB audit log      (timeline events)
//   - Playwright extraction   (portal cross-check)
// =====================================================================

export type CheckSeverity = "ok" | "warning" | "critical" | "info";

export interface Check {
  label: string;
  severity: CheckSeverity;
  detail?: string;
}

export interface POValidation {
  poNumber: string;
  status: "active" | "closed" | "draft";
  poTotal: number;
  poBilled: number;
  poBalance: number;
  vendorMatch: boolean;
  approvalState: "approved" | "pending" | "rejected";
  checks: Check[];
}

export interface LineItem {
  id: string;
  description: string;
  qtyInvoice: number;
  qtyPortal: number;
  rateInvoice: number;
  ratePortal: number;
  currency: string;
  total: number;
  billingPeriod: string;
  confidence: number;
  issues: string[];
}

export interface ReceivingStatus {
  receivedPct: number;
  grDate: string | null;
  serviceConfirmed: boolean;
  overbilling: boolean;
  checks: Check[];
}

export interface TaxAnalysis {
  vendorState: string;
  buyerState: string;
  interstate: boolean;
  appliedTax: "IGST" | "CGST+SGST";
  expectedTax: "IGST" | "CGST+SGST";
  taxRate: number;
  hsnValid: boolean;
  gstinValid: boolean;
  mathValid: boolean;
  checks: Check[];
  reasoning: string;
}

export interface AmountReconciliation {
  taxableValue: number;
  taxTotal: number;
  roundOff: number;
  computedTotal: number;
  declaredTotal: number;
  amountInWords: string;
  wordsMatchNumeric: boolean;
  checks: Check[];
}

export interface DuplicateCheck {
  riskScore: number;
  similarInvoices: { id: string; similarity: number; reason: string }[];
  confidence: number;
  checks: Check[];
}

export interface VendorCheck {
  existsInPortal: boolean;
  gstinValid: boolean;
  poMappingValid: boolean;
  approvedSupplier: boolean;
  checks: Check[];
}

export interface DateCheck {
  invoiceDate: string;
  poCreatedDate: string;
  poExpiryDate: string;
  billingPeriod: string;
  checks: Check[];
}

export interface ConfidenceBreakdown {
  ocr: number;
  extraction: number;
  validation: number;
  vendorHistory: number;
  crossField: number;
  portalMatch: number;
  overall: number;
  autoSubmitEligible: boolean;
}

export interface TimelineEvent {
  label: string;
  at: string;
  status: "done" | "active" | "pending" | "failed";
  actor: string;
}

export interface RiskScore {
  level: "low" | "medium" | "high";
  score: number;
  reasons: string[];
}

export interface RoutingDecision {
  decision: "auto_submit" | "human_review" | "reject";
  threshold: number;
  rationale: string;
}

export interface ValidationBundle {
  po: POValidation;
  lineItems: LineItem[];
  receiving: ReceivingStatus;
  tax: TaxAnalysis;
  amount: AmountReconciliation;
  duplicate: DuplicateCheck;
  vendor: VendorCheck;
  dates: DateCheck;
  confidence: ConfidenceBreakdown;
  timeline: TimelineEvent[];
  risk: RiskScore;
  routing: RoutingDecision;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pct(n: number): number {
  return Math.round(n * 1000) / 10;
}

function numberToWordsINR(n: number): string {
  // Lightweight INR number-to-words for display only.
  // TODO(backend): replace with server-side authoritative converter.
  if (n === 0) return "Zero Rupees Only";
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
    "Sixteen", "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const twoDigits = (x: number): string =>
    x < 20 ? ones[x] : `${tens[Math.floor(x / 10)]}${x % 10 ? " " + ones[x % 10] : ""}`;
  const threeDigits = (x: number): string => {
    const h = Math.floor(x / 100);
    const r = x % 100;
    return `${h ? ones[h] + " Hundred" + (r ? " " : "") : ""}${r ? twoDigits(r) : ""}`;
  };
  let num = Math.floor(n);
  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  const rest = num;
  return [
    crore ? twoDigits(crore) + " Crore" : "",
    lakh ? twoDigits(lakh) + " Lakh" : "",
    thousand ? twoDigits(thousand) + " Thousand" : "",
    rest ? threeDigits(rest) : "",
  ].filter(Boolean).join(" ").trim() + " Rupees Only";
}

export function buildValidationBundle(invoice: Invoice): ValidationBundle {
  const seed = hash(invoice.id);
  const flagged = invoice.status === "human_review" || invoice.status === "submission_failed";
  const submitted = invoice.status === "auto_submitted";

  // ---- PO Validation -------------------------------------------------
  const poNumber = `PO-2026-${String(8000 + (seed % 900)).padStart(4, "0")}`;
  const poTotal = Math.round(invoice.amount * (1.4 + ((seed % 7) / 20)));
  const poBilled = Math.round(poTotal * (flagged ? 0.78 : 0.42));
  const poBalance = poTotal - poBilled;
  const exceedsBalance = invoice.amount > poBalance;
  const poClosed = (seed % 13) === 0 && flagged;
  const vendorMatch = !(flagged && (seed % 5) === 0);
  const po: POValidation = {
    poNumber,
    status: poClosed ? "closed" : "active",
    poTotal,
    poBilled,
    poBalance,
    vendorMatch,
    approvalState: "approved",
    checks: [
      { label: "PO exists in procurement portal", severity: "ok" },
      { label: poClosed ? "PO is closed — cannot bill" : "PO is active", severity: poClosed ? "critical" : "ok" },
      { label: vendorMatch ? "Vendor matches PO record" : "Vendor mismatch vs PO", severity: vendorMatch ? "ok" : "critical" },
      {
        label: exceedsBalance ? "Invoice exceeds remaining PO balance" : "Invoice within PO balance",
        severity: exceedsBalance ? "critical" : "ok",
        detail: `Remaining ₹${poBalance.toLocaleString("en-IN")}`,
      },
      { label: poBilled / poTotal >= 0.95 ? "PO almost fully billed" : "PO has billing headroom", severity: poBilled / poTotal >= 0.95 ? "warning" : "ok" },
    ],
  };

  // ---- Line Items ----------------------------------------------------
  const lineCount = 2 + (seed % 3);
  const lineItems: LineItem[] = Array.from({ length: lineCount }, (_, i) => {
    const qtyInvoice = 8 + ((seed + i * 7) % 24);
    const qtyDrift = flagged && i === 0 ? 2 : 0;
    const rateInvoice = Math.round((invoice.amount / lineCount / qtyInvoice));
    const rateDrift = flagged && i === 1 ? Math.round(rateInvoice * 0.07) : 0;
    const issues: string[] = [];
    if (qtyDrift) issues.push("Quantity mismatch");
    if (rateDrift) issues.push("Rate mismatch");
    if (flagged && i === 0 && (seed % 4) === 0) issues.push("Duplicate billing period");
    return {
      id: `${invoice.id}-L${i + 1}`,
      description: ["Managed Cloud Hours", "Professional Services", "Compliance Audit", "Support Retainer", "Platform License"][i % 5],
      qtyInvoice,
      qtyPortal: qtyInvoice - qtyDrift,
      rateInvoice: rateInvoice + rateDrift,
      ratePortal: rateInvoice,
      currency: invoice.extracted.currency,
      total: (qtyInvoice) * (rateInvoice + rateDrift),
      billingPeriod: i === 0 ? "Feb 2026 H1" : i === 1 ? "Feb 2026 H2" : "Jan 2026",
      confidence: Math.max(0.6, Math.min(0.99, 0.95 - issues.length * 0.12 - (i * 0.02))),
      issues,
    };
  });

  // ---- Receiving -----------------------------------------------------
  const receivedPct = flagged ? 70 + (seed % 15) : 95 + (seed % 6);
  const grMissing = flagged && (seed % 6) === 0;
  const overbilling = receivedPct < 100 && flagged;
  const receiving: ReceivingStatus = {
    receivedPct: Math.min(100, receivedPct),
    grDate: grMissing ? null : invoice.extracted.invoiceDate,
    serviceConfirmed: !grMissing,
    overbilling,
    checks: [
      { label: `Received ${Math.min(100, receivedPct)}% of ordered quantity`, severity: receivedPct < 90 ? "warning" : "ok" },
      { label: grMissing ? "Goods Receipt date missing" : "GR date present", severity: grMissing ? "critical" : "ok" },
      { label: overbilling ? "Invoice exceeds received quantity" : "Within received quantity", severity: overbilling ? "warning" : "ok" },
    ],
  };

  // ---- Tax Analysis --------------------------------------------------
  const vendorState = ["Maharashtra", "Karnataka", "Tamil Nadu", "Delhi", "Gujarat"][seed % 5];
  const buyerState = "Karnataka";
  const interstate = vendorState !== buyerState;
  const appliedTax: "IGST" | "CGST+SGST" =
    invoice.extracted.taxRate === 18 || interstate ? "IGST" : "CGST+SGST";
  const expectedTax: "IGST" | "CGST+SGST" = interstate ? "IGST" : "CGST+SGST";
  const taxMisapplied = appliedTax !== expectedTax;
  const computedTax = Math.round(invoice.extracted.subtotal * (invoice.extracted.taxRate / 100));
  const mathValid = Math.abs(computedTax - invoice.extracted.taxAmount) < 2;
  const gstinValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/.test(invoice.extracted.gstNumber);
  const tax: TaxAnalysis = {
    vendorState,
    buyerState,
    interstate,
    appliedTax,
    expectedTax,
    taxRate: invoice.extracted.taxRate,
    hsnValid: true,
    gstinValid,
    mathValid,
    checks: [
      { label: `GSTIN format ${gstinValid ? "valid" : "invalid"}`, severity: gstinValid ? "ok" : "critical" },
      { label: taxMisapplied ? `Wrong tax kind — expected ${expectedTax}` : `${appliedTax} correctly applied`, severity: taxMisapplied ? "critical" : "ok" },
      { label: mathValid ? "Tax math reconciles" : "Tax computation drift", severity: mathValid ? "ok" : "warning" },
      { label: "HSN/SAC code compliant", severity: "ok" },
    ],
    reasoning: interstate
      ? `Vendor (${vendorState}) ↔ Buyer (${buyerState}) → interstate transaction. IGST ${invoice.extracted.taxRate}% ${taxMisapplied ? "MIS-applied" : "correctly applied"}.`
      : `Intrastate transaction (${vendorState}). CGST+SGST split expected; ${taxMisapplied ? "vendor charged IGST in error" : "correctly applied"}.`,
  };

  // ---- Amount Reconciliation -----------------------------------------
  const taxableValue = invoice.extracted.subtotal;
  const taxTotal = invoice.extracted.taxAmount;
  const computedTotal = taxableValue + taxTotal;
  const roundOff = invoice.extracted.totalAmount - computedTotal;
  const declaredTotal = invoice.extracted.totalAmount;
  const amountInWords = numberToWordsINR(declaredTotal);
  const wordsMatchNumeric = true; // assumed; TODO(backend): verify via parsed amount-in-words
  const amount: AmountReconciliation = {
    taxableValue,
    taxTotal,
    roundOff,
    computedTotal,
    declaredTotal,
    amountInWords,
    wordsMatchNumeric,
    checks: [
      { label: "Taxable value matches line items", severity: "ok" },
      { label: Math.abs(roundOff) <= 1 ? "Round-off within ±₹1" : "Round-off exceeds ±₹1", severity: Math.abs(roundOff) <= 1 ? "ok" : "warning" },
      { label: wordsMatchNumeric ? "Amount-in-words matches numeric" : "Amount-in-words mismatch", severity: wordsMatchNumeric ? "ok" : "critical" },
    ],
  };

  // ---- Duplicate Detection -------------------------------------------
  const dupRisk = flagged ? 35 + (seed % 50) : 4 + (seed % 8);
  const duplicate: DuplicateCheck = {
    riskScore: dupRisk,
    confidence: 0.7 + (seed % 25) / 100,
    similarInvoices: dupRisk > 30
      ? [
          { id: `INV-2026-${String(900 + (seed % 80)).padStart(4, "0")}`, similarity: 0.92, reason: "Same PO + amount" },
          { id: `INV-2026-${String(800 + (seed % 70)).padStart(4, "0")}`, similarity: 0.78, reason: "Same billing period" },
        ]
      : [],
    checks: [
      { label: "Invoice number unique", severity: "ok" },
      { label: dupRisk > 30 ? "Similar vendor submission detected" : "No duplicate vendor submissions", severity: dupRisk > 30 ? "warning" : "ok" },
      { label: dupRisk > 50 ? "Same PO + amount previously billed" : "PO + amount unique", severity: dupRisk > 50 ? "critical" : "ok" },
    ],
  };

  // ---- Vendor Check --------------------------------------------------
  const vendor: VendorCheck = {
    existsInPortal: true,
    gstinValid,
    poMappingValid: vendorMatch,
    approvedSupplier: true,
    checks: [
      { label: "Vendor exists in portal master", severity: "ok" },
      { label: gstinValid ? "GSTIN validated" : "GSTIN invalid", severity: gstinValid ? "ok" : "critical" },
      { label: vendorMatch ? "Vendor ↔ PO mapping verified" : "Vendor not on PO", severity: vendorMatch ? "ok" : "critical" },
      { label: "Approved supplier — active", severity: "ok" },
    ],
  };

  // ---- Date Checks ---------------------------------------------------
  const poCreatedDate = "2026-01-05";
  const poExpiryDate = "2026-12-31";
  const dates: DateCheck = {
    invoiceDate: invoice.extracted.invoiceDate,
    poCreatedDate,
    poExpiryDate,
    billingPeriod: "Feb 2026",
    checks: [
      { label: "Invoice date not in future", severity: "ok" },
      { label: "Invoice date after PO creation", severity: "ok" },
      { label: "Invoice date before PO expiry", severity: "ok" },
      { label: "Billing period within active contract", severity: "ok" },
    ],
  };

  // ---- Confidence Breakdown ------------------------------------------
  const breakdown = {
    ocr: pct(0.94 + (seed % 5) / 100),
    extraction: pct(invoice.confidence),
    validation: flagged ? 64 + (seed % 12) : 96 + (seed % 4),
    vendorHistory: 88 + (seed % 10),
    crossField: flagged ? 70 : 95,
    portalMatch: flagged ? 65 : 98,
  };
  const overall = Math.round(
    (breakdown.ocr + breakdown.extraction + breakdown.validation +
     breakdown.vendorHistory + breakdown.crossField + breakdown.portalMatch) / 6,
  );
  const confidence: ConfidenceBreakdown = {
    ...breakdown,
    overall,
    autoSubmitEligible: overall >= 90 && !flagged,
  };

  // ---- Timeline ------------------------------------------------------
  const baseT = new Date(invoice.uploadedAt).getTime();
  const at = (offsetMs: number) => new Date(baseT + offsetMs).toISOString();
  const timeline: TimelineEvent[] = [
    { label: "Invoice uploaded", at: at(0), status: "done", actor: invoice.source },
    { label: "OCR completed", at: at(8_000), status: "done", actor: "Textract" },
    { label: "AI extraction completed", at: at(14_000), status: "done", actor: "Bedrock" },
    { label: "PO validation completed", at: at(22_000), status: po.checks.some(c => c.severity === "critical") ? "failed" : "done", actor: "Procurement API" },
    { label: "Tax validation completed", at: at(28_000), status: taxMisapplied ? "failed" : "done", actor: "GST Engine" },
    flagged
      ? { label: "Routed for human review", at: at(34_000), status: "active", actor: "Routing Engine" }
      : { label: "Auto-submitted to portal", at: at(44_000), status: submitted ? "done" : "pending", actor: "Playwright" },
  ];

  // ---- Risk Score ----------------------------------------------------
  const criticalCount = [
    ...po.checks, ...tax.checks, ...vendor.checks, ...amount.checks,
  ].filter(c => c.severity === "critical").length;
  const warnCount = [
    ...po.checks, ...tax.checks, ...receiving.checks, ...amount.checks, ...duplicate.checks,
  ].filter(c => c.severity === "warning").length;
  const riskRaw = criticalCount * 30 + warnCount * 10 + (dupRisk > 50 ? 20 : 0);
  const level: RiskScore["level"] = riskRaw >= 50 ? "high" : riskRaw >= 20 ? "medium" : "low";
  const risk: RiskScore = {
    level,
    score: Math.min(100, riskRaw),
    reasons: [
      criticalCount ? `${criticalCount} critical validation failure(s)` : "",
      warnCount ? `${warnCount} warning(s)` : "",
      dupRisk > 30 ? `Duplicate risk ${dupRisk}%` : "",
      taxMisapplied ? "Tax kind mis-applied" : "",
    ].filter(Boolean),
  };

  // ---- Routing Decision ----------------------------------------------
  const decision: RoutingDecision["decision"] = criticalCount > 0
    ? "reject"
    : (level === "low" && overall >= 90 ? "auto_submit" : "human_review");
  const routing: RoutingDecision = {
    decision,
    threshold: 90,
    rationale: decision === "auto_submit"
      ? `Confidence ${overall}% ≥ threshold 90% and zero criticals — eligible for auto-submission.`
      : decision === "reject"
        ? `${criticalCount} critical compliance failure(s) — hard reject; will not auto-submit.`
        : `Moderate issues detected (risk ${level}, confidence ${overall}%) — routing to human reviewer.`,
  };

  return {
    po, lineItems, receiving, tax, amount, duplicate, vendor, dates,
    confidence, timeline, risk, routing,
  };
}
