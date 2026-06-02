import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { InvoiceTable } from "@/components/shared/InvoiceTable";
import { useApp } from "@/store/appStore";
import { ShieldCheck, Scale, Copy, Globe } from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";

export const Route = createFileRoute("/_app/validation")({
  head: () => ({ meta: [{ title: "Validation Center · Invoice AI" }] }),
  component: ValidationPage,
});

function ValidationPage() {
  const { invoices } = useApp();
  const navigate = useNavigate();
  // TODO: Fetch validation results from backend validation service
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Validation Center</h1>
        <p className="text-sm text-muted-foreground">
          Rule, tax, duplicate, and portal cross-check engine results.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Rules Passed" value="98.4%" icon={<Scale className="h-4 w-4" />} accent="success" />
        <MetricCard title="Tax Validated" value="100%" icon={<ShieldCheck className="h-4 w-4" />} accent="success" />
        <MetricCard title="Duplicates Blocked" value={12} icon={<Copy className="h-4 w-4" />} accent="warning" />
        <MetricCard title="Portal Mismatches" value={invoices.filter(i => i.mismatches.length).length} icon={<Globe className="h-4 w-4" />} accent="ai" />
      </div>
      <Card className="overflow-hidden p-0">
        <div className="border-b px-4 py-3 text-sm font-semibold">Validation results</div>
        <InvoiceTable invoices={invoices} onRowClick={() => navigate({ to: "/review" })} />
      </Card>
    </div>
  );
}
