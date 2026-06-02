import type { Invoice, AuditEvent } from "@/types/invoice";

const vendors = [
  "ABC Manufacturing",
  "Crestline Logistics",
  "Helix Pharma Pvt Ltd",
  "Northwind Steel Works",
  "Orbit Cloud Services",
  "Sunrise Textiles",
  "Vertex Components",
  "Globex Industrial",
  "Pinnacle Foods Co",
  "Atlas Freight Lines",
];

const sources: Invoice["source"][] = ["email", "shared_drive", "manual_upload"];
const reviewers = ["Priya S.", "Marcus T.", "Aisha K.", "Daniel R.", "—"];

function rand(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Stable base epoch so SSR & client render identical timestamps
const BASE_TS = Date.UTC(2026, 1, 14, 9, 30, 0);
function makeInvoice(i: number): Invoice {
  const vendor = vendors[i % vendors.length];
  const amount = Math.round(5000 + rand(i) * 95000);
  const flagged = rand(i + 1) < 0.22;
  const failed = !flagged && rand(i + 7) < 0.05;
  const extracting = !flagged && !failed && i < 3;
  const validating = !flagged && !failed && i >= 3 && i < 5;
  const portalAmount = flagged
    ? amount + Math.round((rand(i + 3) - 0.5) * 1200)
    : amount;
  const status: Invoice["status"] = flagged
    ? "human_review"
    : failed
      ? "submission_failed"
      : extracting
        ? "extracting"
        : validating
          ? "validating"
          : "auto_submitted";
  const confidence = flagged
    ? 0.62 + rand(i + 5) * 0.18
    : 0.9 + rand(i + 5) * 0.09;
  const id = `INV-2026-${String(1000 + i).padStart(4, "0")}`;
  const taxRateExtracted = flagged && rand(i + 2) > 0.5 ? 18 : 15;
  const taxRatePortal = 15;
  const subtotal = Math.round(amount / 1.15);
  const mismatches: string[] = [];
  if (flagged) {
    if (taxRateExtracted !== taxRatePortal) mismatches.push("GST rate mismatch");
    if (portalAmount !== amount) mismatches.push("Total amount mismatch");
    if (rand(i + 9) < 0.25) mismatches.push("Possible duplicate invoice");
  }

  return {
    id,
    vendor,
    amount,
    portalAmount,
    uploadedAt: new Date(BASE_TS - i * 1000 * 60 * 17).toISOString(),
    source: sources[i % sources.length],
    status,
    confidence,
    assignedTo: flagged ? reviewers[i % (reviewers.length - 1)] : undefined,
    priority: flagged ? (amount > 50000 ? "high" : "medium") : "low",
    reason: mismatches[0],
    extracted: {
      invoiceNumber: id,
      vendorName: vendor,
      gstNumber: `27AABCU${9600 + i}R1Z${i % 9}`,
      invoiceDate: new Date(BASE_TS - i * 1000 * 60 * 60 * 6)
        .toISOString()
        .slice(0, 10),
      currency: "INR",
      subtotal,
      taxRate: taxRateExtracted,
      taxAmount: Math.round(subtotal * (taxRateExtracted / 100)),
      totalAmount: amount,
    },
    portal: {
      invoiceNumber: id,
      vendorName: vendor,
      gstNumber: `27AABCU${9600 + i}R1Z${i % 9}`,
      invoiceDate: new Date(BASE_TS - i * 1000 * 60 * 60 * 6)
        .toISOString()
        .slice(0, 10),
      currency: "INR",
      subtotal: Math.round(portalAmount / 1.15),
      taxRate: taxRatePortal,
      taxAmount: Math.round((portalAmount / 1.15) * (taxRatePortal / 100)),
      totalAmount: portalAmount,
    },
    mismatches,
    aiExplanation: flagged
      ? `Total differs by ₹${Math.abs(amount - portalAmount)} due to ${mismatches.join(", ").toLowerCase()}. Extracted GST = ${taxRateExtracted}%, portal configured GST = ${taxRatePortal}%. Recommend human verification.`
      : `All fields matched portal records with ${(confidence * 100).toFixed(1)}% confidence. Auto-submission cleared by validation engine.`,
  };
}

export const mockInvoices: Invoice[] = Array.from({ length: 24 }, (_, i) =>
  makeInvoice(i),
);

export const mockAudit: AuditEvent[] = mockInvoices.flatMap((inv, i) => {
  const base: AuditEvent[] = [
    {
      id: `${inv.id}-A1`,
      invoiceId: inv.id,
      actor: "Lambda: ingest-fn",
      action: `Invoice received from ${inv.source}`,
      timestamp: inv.uploadedAt,
      status: "info",
    },
    {
      id: `${inv.id}-A2`,
      invoiceId: inv.id,
      actor: "Bedrock + Textract",
      action: `Extracted ${Object.keys(inv.extracted).length} fields · confidence ${(inv.confidence * 100).toFixed(1)}%`,
      timestamp: new Date(new Date(inv.uploadedAt).getTime() + 12000).toISOString(),
      status: "success",
    },
  ];
  if (inv.status === "auto_submitted") {
    base.push({
      id: `${inv.id}-A3`,
      invoiceId: inv.id,
      actor: "ECS Fargate: playwright-agent",
      action: "Auto-submitted to vendor portal",
      timestamp: new Date(new Date(inv.uploadedAt).getTime() + 45000).toISOString(),
      status: "success",
    });
  } else if (inv.status === "human_review") {
    base.push({
      id: `${inv.id}-A3`,
      invoiceId: inv.id,
      actor: "Validation Engine",
      action: `Routed for human review: ${inv.reason}`,
      timestamp: new Date(new Date(inv.uploadedAt).getTime() + 28000).toISOString(),
      status: "warning",
    });
  } else if (inv.status === "submission_failed") {
    base.push({
      id: `${inv.id}-A3`,
      invoiceId: inv.id,
      actor: "Playwright Agent",
      action: "Submission failed — portal returned 502",
      timestamp: new Date(new Date(inv.uploadedAt).getTime() + 60000).toISOString(),
      status: "error",
    });
  }
  return base.map((e, j) => ({ ...e, id: `${e.id}-${i}-${j}` }));
});
