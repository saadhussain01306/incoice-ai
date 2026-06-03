import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileBarChart2,
  Boxes,
  PackageCheck,
  Receipt,
  Calculator,
  Copy as CopyIcon,
  Building2,
  CalendarClock,
  Gauge,
  Activity,
  ShieldAlert,
  ArrowRightCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Invoice } from "@/types/invoice";
import {
  buildValidationBundle,
  type Check,
  type CheckSeverity,
} from "@/lib/validation-engine";

// =====================================================================
// Enterprise validation modules — consumed by the Human Review workspace.
// All modules are presentation-only; they read derived data from the
// validation engine. Backend integration points are marked with TODO.
// =====================================================================

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function sevColor(sev: CheckSeverity) {
  return sev === "ok"
    ? "text-success"
    : sev === "warning"
      ? "text-warning"
      : sev === "critical"
        ? "text-destructive"
        : "text-info";
}

function SevIcon({ sev }: { sev: CheckSeverity }) {
  const cls = cn("h-3.5 w-3.5 shrink-0", sevColor(sev));
  if (sev === "ok") return <CheckCircle2 className={cls} />;
  if (sev === "warning") return <AlertTriangle className={cls} />;
  if (sev === "critical") return <XCircle className={cls} />;
  return <Activity className={cls} />;
}

function ChecksList({ checks }: { checks: Check[] }) {
  return (
    <ul className="space-y-1.5">
      {checks.map((c) => (
        <li key={c.label} className="flex items-start gap-2 text-xs">
          <SevIcon sev={c.severity} />
          <span className="flex-1">
            <span className={cn("font-medium", sevColor(c.severity))}>{c.label}</span>
            {c.detail && <span className="ml-1.5 text-muted-foreground">· {c.detail}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ModuleCard({
  icon,
  title,
  badge,
  badgeTone = "info",
  children,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  badgeTone?: "success" | "warning" | "destructive" | "info" | "ai";
  children: React.ReactNode;
}) {
  const toneCls = {
    success: "border-success/30 bg-success/10 text-success",
    warning: "border-warning/30 bg-warning/10 text-warning",
    destructive: "border-destructive/30 bg-destructive/10 text-destructive",
    info: "border-info/30 bg-info/10 text-info",
    ai: "border-ai/30 bg-ai/10 text-ai",
  }[badgeTone];
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-accent/60 text-foreground/80">
            {icon}
          </div>
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        {badge && (
          <Badge variant="outline" className={cn("text-[10px]", toneCls)}>
            {badge}
          </Badge>
        )}
      </div>
      {children}
    </Card>
  );
}

export function ValidationModules({ invoice }: { invoice: Invoice }) {
  const v = buildValidationBundle(invoice);

  return (
    <div className="space-y-4">
      {/* Top row: PO + Receiving + Risk/Routing */}
      <div className="grid gap-4 lg:grid-cols-3">
        <POValidationModule v={v.po} />
        <ReceivingModule v={v.receiving} />
        <RoutingRiskModule risk={v.risk} routing={v.routing} confidence={v.confidence} />
      </div>

      {/* Line items full width */}
      <LineItemsModule items={v.lineItems} />

      {/* Tax + Amount */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TaxModule v={v.tax} />
        <AmountModule v={v.amount} />
      </div>

      {/* Vendor + Dates + Duplicate */}
      <div className="grid gap-4 lg:grid-cols-3">
        <VendorModule v={v.vendor} />
        <DateModule v={v.dates} />
        <DuplicateModule v={v.duplicate} />
      </div>

      {/* Confidence + Timeline */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ConfidenceModule v={v.confidence} />
        <TimelineModule events={v.timeline} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Individual modules
// ---------------------------------------------------------------------

function POValidationModule({ v }: { v: ReturnType<typeof buildValidationBundle>["po"] }) {
  const billPct = Math.round((v.poBilled / v.poTotal) * 100);
  const critical = v.checks.some((c) => c.severity === "critical");
  // TODO(backend): Fetch PO details from ERP/Procurement API by v.poNumber
  // TODO(backend): Validate invoice amount against remaining PO balance live
  return (
    <ModuleCard
      icon={<FileBarChart2 className="h-3.5 w-3.5" />}
      title="Purchase Order"
      badge={critical ? "Critical" : v.status === "active" ? "Matched" : v.status}
      badgeTone={critical ? "destructive" : v.status === "active" ? "success" : "warning"}
    >
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="font-mono">{v.poNumber}</span>
        <span className="text-muted-foreground">{v.approvalState}</span>
      </div>
      <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
        <span>Billed {fmt(v.poBilled)}</span>
        <span>Total {fmt(v.poTotal)}</span>
      </div>
      <Progress value={billPct} className="h-1.5" />
      <div className="mt-1 text-[11px] text-muted-foreground">
        Remaining balance <span className="font-medium text-foreground">{fmt(v.poBalance)}</span>
      </div>
      <div className="mt-3 border-t pt-3">
        <ChecksList checks={v.checks} />
      </div>
    </ModuleCard>
  );
}

function ReceivingModule({ v }: { v: ReturnType<typeof buildValidationBundle>["receiving"] }) {
  // TODO(backend): GR data via Procurement/Inventory API
  const warn = v.overbilling || v.grDate === null;
  return (
    <ModuleCard
      icon={<PackageCheck className="h-3.5 w-3.5" />}
      title="Receiving Status"
      badge={warn ? (v.grDate === null ? "GR missing" : "Overbilled") : "Confirmed"}
      badgeTone={warn ? "warning" : "success"}
    >
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Received</span>
        <span className="font-medium tabular-nums">{v.receivedPct}%</span>
      </div>
      <Progress value={v.receivedPct} className="h-1.5" />
      {v.overbilling && (
        <div className="mt-2 rounded-md border border-warning/30 bg-warning/10 px-2 py-1.5 text-[11px] text-warning">
          Invoice exceeds received quantity.
        </div>
      )}
      <div className="mt-3 border-t pt-3">
        <ChecksList checks={v.checks} />
      </div>
    </ModuleCard>
  );
}

function RoutingRiskModule({
  risk,
  routing,
  confidence,
}: {
  risk: ReturnType<typeof buildValidationBundle>["risk"];
  routing: ReturnType<typeof buildValidationBundle>["routing"];
  confidence: ReturnType<typeof buildValidationBundle>["confidence"];
}) {
  const tone =
    risk.level === "low" ? "success" : risk.level === "medium" ? "warning" : "destructive";
  const decisionLabel = {
    auto_submit: "Auto-submit",
    human_review: "Human review",
    reject: "Hard reject",
  }[routing.decision];
  return (
    <ModuleCard
      icon={<ShieldAlert className="h-3.5 w-3.5" />}
      title="Routing & Risk"
      badge={`${risk.level.toUpperCase()} · ${risk.score}`}
      badgeTone={tone}
    >
      <div className="mb-2 flex items-center gap-2 text-xs">
        <ArrowRightCircle className="h-3.5 w-3.5 text-ai" />
        <span className="font-semibold">{decisionLabel}</span>
        <span className="text-muted-foreground">· threshold {routing.threshold}%</span>
      </div>
      <p className="text-xs text-muted-foreground">{routing.rationale}</p>
      {risk.reasons.length > 0 && (
        <ul className="mt-2 list-disc pl-4 text-[11px] text-muted-foreground">
          {risk.reasons.map((r) => <li key={r}>{r}</li>)}
        </ul>
      )}
      <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs">
        <span className="text-muted-foreground">Composite confidence</span>
        <span className={cn("font-semibold", confidence.autoSubmitEligible ? "text-success" : "text-warning")}>
          {confidence.overall}%
        </span>
      </div>
    </ModuleCard>
  );
}

function LineItemsModule({ items }: { items: ReturnType<typeof buildValidationBundle>["lineItems"] }) {
  // TODO(backend): Fetch requisition lines via Procurement API for side-by-side compare
  const flagged = items.filter((i) => i.issues.length).length;
  return (
    <Card className="p-0">
      <Accordion type="single" collapsible defaultValue={flagged ? "li" : undefined}>
        <AccordionItem value="li" className="border-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex flex-1 items-center justify-between pr-2">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-md bg-accent/60">
                  <Boxes className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-semibold">Line Item Reconciliation</span>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  flagged
                    ? "border-warning/30 bg-warning/10 text-warning"
                    : "border-success/30 bg-success/10 text-success",
                )}
              >
                {flagged ? `${flagged} mismatch` : "All matched"}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-0 pb-0">
            <div className="overflow-x-auto border-t">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Description</th>
                    <th className="px-3 py-2 text-left">Period</th>
                    <th className="px-3 py-2 text-right">Qty (inv / portal)</th>
                    <th className="px-3 py-2 text-right">Rate (inv / portal)</th>
                    <th className="px-3 py-2 text-right">Line total</th>
                    <th className="px-3 py-2 text-right">Confidence</th>
                    <th className="px-3 py-2 text-left">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((li) => {
                    const qtyBad = li.qtyInvoice !== li.qtyPortal;
                    const rateBad = li.rateInvoice !== li.ratePortal;
                    return (
                      <tr key={li.id} className="border-t">
                        <td className="px-3 py-2 font-medium">{li.description}</td>
                        <td className="px-3 py-2 text-muted-foreground">{li.billingPeriod}</td>
                        <td className={cn("px-3 py-2 text-right tabular-nums", qtyBad && "text-destructive")}>
                          {li.qtyInvoice} / {li.qtyPortal}
                        </td>
                        <td className={cn("px-3 py-2 text-right tabular-nums", rateBad && "text-destructive")}>
                          {fmt(li.rateInvoice)} / {fmt(li.ratePortal)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmt(li.total)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          <span className={cn(li.confidence < 0.8 ? "text-warning" : "text-success")}>
                            {(li.confidence * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {li.issues.length === 0 ? (
                            <span className="text-success">OK</span>
                          ) : (
                            <span className="text-destructive">{li.issues.join(" · ")}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

function TaxModule({ v }: { v: ReturnType<typeof buildValidationBundle>["tax"] }) {
  // TODO(backend): GSTIN active-status check via GSTN API; HSN/SAC compliance via tax catalogue
  const critical = v.checks.some((c) => c.severity === "critical");
  return (
    <ModuleCard
      icon={<Receipt className="h-3.5 w-3.5" />}
      title="Advanced Tax Validation"
      badge={critical ? "Critical" : "Compliant"}
      badgeTone={critical ? "destructive" : "success"}
    >
      <div className="mb-3 grid grid-cols-2 gap-2 text-[11px]">
        <Pair label="Vendor state" value={v.vendorState} />
        <Pair label="Buyer state" value={v.buyerState} />
        <Pair label="Applied" value={`${v.appliedTax} @ ${v.taxRate}%`} />
        <Pair label="Expected" value={v.expectedTax} />
      </div>
      <div className="mb-3 rounded-md border border-ai/30 bg-ai/5 p-2 text-[11px] text-foreground/90">
        <Sparkles className="mr-1 inline h-3 w-3 text-ai" />
        {v.reasoning}
      </div>
      <ChecksList checks={v.checks} />
    </ModuleCard>
  );
}

function AmountModule({ v }: { v: ReturnType<typeof buildValidationBundle>["amount"] }) {
  const drift = v.declaredTotal - v.computedTotal;
  return (
    <ModuleCard
      icon={<Calculator className="h-3.5 w-3.5" />}
      title="Amount Reconciliation"
      badge={Math.abs(drift) <= 1 ? "Balanced" : "Drift"}
      badgeTone={Math.abs(drift) <= 1 ? "success" : "warning"}
    >
      <dl className="mb-3 divide-y text-xs">
        <Row label="Taxable value" value={fmt(v.taxableValue)} />
        <Row label="Tax total" value={fmt(v.taxTotal)} />
        <Row label="Computed total" value={fmt(v.computedTotal)} />
        <Row label="Round-off" value={fmt(v.roundOff)} highlight={Math.abs(v.roundOff) > 1} />
        <Row label="Declared total" value={fmt(v.declaredTotal)} bold />
      </dl>
      <div className="mb-3 rounded-md bg-muted/40 px-2 py-1.5 text-[11px] italic text-muted-foreground">
        “{v.amountInWords}”
      </div>
      <ChecksList checks={v.checks} />
    </ModuleCard>
  );
}

function VendorModule({ v }: { v: ReturnType<typeof buildValidationBundle>["vendor"] }) {
  // TODO(backend): Vendor master + approved-supplier flag from ERP
  const ok = v.checks.every((c) => c.severity === "ok");
  return (
    <ModuleCard
      icon={<Building2 className="h-3.5 w-3.5" />}
      title="Vendor Validation"
      badge={ok ? "Verified" : "Issues"}
      badgeTone={ok ? "success" : "destructive"}
    >
      <ChecksList checks={v.checks} />
    </ModuleCard>
  );
}

function DateModule({ v }: { v: ReturnType<typeof buildValidationBundle>["dates"] }) {
  return (
    <ModuleCard
      icon={<CalendarClock className="h-3.5 w-3.5" />}
      title="Date Validation"
      badge="Within window"
      badgeTone="success"
    >
      <div className="mb-2 grid grid-cols-2 gap-2 text-[11px]">
        <Pair label="Invoice date" value={v.invoiceDate} />
        <Pair label="Billing period" value={v.billingPeriod} />
        <Pair label="PO created" value={v.poCreatedDate} />
        <Pair label="PO expiry" value={v.poExpiryDate} />
      </div>
      <ChecksList checks={v.checks} />
    </ModuleCard>
  );
}

function DuplicateModule({ v }: { v: ReturnType<typeof buildValidationBundle>["duplicate"] }) {
  // TODO(backend): Vector-similarity duplicate search across DynamoDB invoice index
  const tone = v.riskScore >= 50 ? "destructive" : v.riskScore >= 25 ? "warning" : "success";
  return (
    <ModuleCard
      icon={<CopyIcon className="h-3.5 w-3.5" />}
      title="Duplicate / Fraud Risk"
      badge={`Risk ${v.riskScore}`}
      badgeTone={tone}
    >
      <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Detection confidence</span>
        <span className="font-medium text-foreground">{(v.confidence * 100).toFixed(0)}%</span>
      </div>
      {v.similarInvoices.length > 0 && (
        <ul className="mb-3 space-y-1 rounded-md border border-warning/30 bg-warning/5 p-2 text-[11px]">
          {v.similarInvoices.map((s) => (
            <li key={s.id} className="flex items-center justify-between">
              <span className="font-mono">{s.id}</span>
              <span className="text-muted-foreground">{s.reason}</span>
              <span className="font-medium text-warning">{(s.similarity * 100).toFixed(0)}%</span>
            </li>
          ))}
        </ul>
      )}
      <ChecksList checks={v.checks} />
    </ModuleCard>
  );
}

function ConfidenceModule({ v }: { v: ReturnType<typeof buildValidationBundle>["confidence"] }) {
  const rows: { label: string; value: number }[] = [
    { label: "OCR", value: v.ocr },
    { label: "AI extraction", value: v.extraction },
    { label: "Validation pass-rate", value: v.validation },
    { label: "Vendor history", value: v.vendorHistory },
    { label: "Cross-field consistency", value: v.crossField },
    { label: "Portal match", value: v.portalMatch },
  ];
  return (
    <ModuleCard
      icon={<Gauge className="h-3.5 w-3.5" />}
      title="Financial Confidence Engine"
      badge={v.autoSubmitEligible ? "Auto-submit eligible" : "Manual gate"}
      badgeTone={v.autoSubmitEligible ? "success" : "warning"}
    >
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums">{v.overall}%</span>
        <span className="text-xs text-muted-foreground">composite confidence</span>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-0.5 flex justify-between text-[11px]">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="tabular-nums">{r.value}%</span>
            </div>
            <Progress value={r.value} className="h-1.5" />
          </div>
        ))}
      </div>
    </ModuleCard>
  );
}

function TimelineModule({ events }: { events: ReturnType<typeof buildValidationBundle>["timeline"] }) {
  return (
    <ModuleCard
      icon={<Activity className="h-3.5 w-3.5" />}
      title="Reconciliation Timeline"
      badge={`${events.length} steps`}
      badgeTone="info"
    >
      <ol className="relative space-y-3 border-l pl-4">
        {events.map((e, i) => {
          const dot =
            e.status === "done"
              ? "bg-success"
              : e.status === "active"
                ? "bg-warning animate-pulse"
                : e.status === "failed"
                  ? "bg-destructive"
                  : "bg-muted";
          return (
            <li key={i} className="relative">
              <span className={cn("absolute -left-[1.4rem] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-background", dot)} />
              <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                <span className="font-medium">{e.label}</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(e.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground">{e.actor}</div>
            </li>
          );
        })}
      </ol>
    </ModuleCard>
  );
}

// ---------------------------------------------------------------------
// Tiny helpers
// ---------------------------------------------------------------------

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xs font-medium">{value}</div>
    </div>
  );
}

function Row({
  label, value, highlight, bold,
}: { label: string; value: string; highlight?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn(
        "tabular-nums",
        bold && "font-semibold",
        highlight && "text-warning",
      )}>{value}</dd>
    </div>
  );
}
