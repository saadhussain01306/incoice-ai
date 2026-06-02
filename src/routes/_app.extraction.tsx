import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PipelineVisualization } from "@/components/pipeline/PipelineVisualization";
import { Card } from "@/components/ui/card";
import { InvoiceTable } from "@/components/shared/InvoiceTable";
import { useApp } from "@/store/appStore";
import { Sparkles, Brain, Gauge } from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";

export const Route = createFileRoute("/_app/extraction")({
  head: () => ({ meta: [{ title: "AI Extraction · Invoice AI" }] }),
  component: ExtractionPage,
});

function ExtractionPage() {
  const { invoices } = useApp();
  const navigate = useNavigate();
  const inflight = invoices.filter((i) => i.status === "extracting" || i.status === "validating");

  // TODO: Fetch extraction results from Lambda + Bedrock pipeline
  // TODO: Poll Step Functions execution status

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Extraction Monitor</h1>
        <p className="text-sm text-muted-foreground">
          Bedrock-powered field extraction with confidence scoring and layout detection.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="In Flight" value={inflight.length} icon={<Sparkles className="h-4 w-4" />} accent="ai" delta="Bedrock active" />
        <MetricCard title="Avg Confidence" value="91.3%" icon={<Gauge className="h-4 w-4" />} accent="info" delta="+2.1% vs last week" deltaTone="positive" />
        <MetricCard title="Model" value="claude-3.5-sonnet" icon={<Brain className="h-4 w-4" />} accent="ai" delta="via AWS Bedrock" />
      </div>
      <PipelineVisualization />
      <Card className="overflow-hidden p-0">
        <div className="border-b px-4 py-3 text-sm font-semibold">Currently extracting</div>
        <InvoiceTable invoices={inflight.length ? inflight : invoices.slice(0, 5)} onRowClick={() => navigate({ to: "/review" })} />
      </Card>
    </div>
  );
}
