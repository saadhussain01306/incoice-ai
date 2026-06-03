import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { InvoiceTable } from "@/components/shared/InvoiceTable";
import { useApp } from "@/store/appStore";
import {
  ShieldCheck,
  Scale,
  Copy,
  Globe,
  FileBarChart2,
  Receipt,
  PackageCheck,
  ShieldAlert,
} from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import { buildValidationBundle } from "@/lib/validation-engine";
import { useMemo } from "react";

export const Route = createFileRoute("/_app/validation")({
  head: () => ({ meta: [{ title: "Validation Center · Invoice AI" }] }),
  component: ValidationPage,
});

function ValidationPage() {
  const { invoices } = useApp();
  const navigate = useNavigate();

  // TODO(backend): replace with aggregated metrics from validation service
  const stats = useMemo(() => {
    const bundles = invoices.map((i) => buildValidationBundle(i));
    const poFail = bundles.filter((b) => b.po.checks.some((c) => c.severity === "critical")).length;
    const taxFail = bundles.filter((b) => b.tax.checks.some((c) => c.severity === "critical")).length;
    const recvWarn = bundles.filter((b) => b.receiving.overbilling || b.receiving.grDate === null).length;
    const dupHigh = bundles.filter((b) => b.duplicate.riskScore >= 30).length;
    const autoEligible = bundles.filter((b) => b.confidence.autoSubmitEligible).length;
    const highRisk = bundles.filter((b) => b.risk.level === "high").length;
    return { poFail, taxFail, recvWarn, dupHigh, autoEligible, highRisk };
  }, [invoices]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Validation Center</h1>
        <p className="text-sm text-muted-foreground">
          PO, tax, receiving, duplicate and portal cross-check engine results.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Rules Passed"
          value={`${Math.round(((invoices.length - stats.poFail - stats.taxFail) / Math.max(1, invoices.length)) * 100)}%`}
          icon={<Scale className="h-4 w-4" />}
          accent="success"
        />
        <MetricCard
          title="Tax Validated"
          value={`${invoices.length - stats.taxFail}/${invoices.length}`}
          icon={<ShieldCheck className="h-4 w-4" />}
          accent={stats.taxFail ? "warning" : "success"}
        />
        <MetricCard
          title="Duplicate Risks"
          value={stats.dupHigh}
          icon={<Copy className="h-4 w-4" />}
          accent="warning"
        />
        <MetricCard
          title="Portal Mismatches"
          value={invoices.filter((i) => i.mismatches.length).length}
          icon={<Globe className="h-4 w-4" />}
          accent="ai"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="PO Validation Failed"
          value={stats.poFail}
          icon={<FileBarChart2 className="h-4 w-4" />}
          accent={stats.poFail ? "destructive" : "success"}
        />
        <MetricCard
          title="Receiving Warnings"
          value={stats.recvWarn}
          icon={<PackageCheck className="h-4 w-4" />}
          accent={stats.recvWarn ? "warning" : "success"}
        />
        <MetricCard
          title="Auto-submit Eligible"
          value={stats.autoEligible}
          icon={<Receipt className="h-4 w-4" />}
          accent="success"
        />
        <MetricCard
          title="High-Risk Invoices"
          value={stats.highRisk}
          icon={<ShieldAlert className="h-4 w-4" />}
          accent={stats.highRisk ? "destructive" : "success"}
        />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b px-4 py-3 text-sm font-semibold">
          Validation results · click a row to open the full reconciliation workspace
        </div>
        <InvoiceTable invoices={invoices} onRowClick={() => navigate({ to: "/review" })} />
      </Card>
    </div>
  );
}
