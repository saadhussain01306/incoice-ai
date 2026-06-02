import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { InvoiceTable } from "@/components/shared/InvoiceTable";
import { useApp } from "@/store/appStore";
import { Bot, Send, RotateCcw, CheckCircle2 } from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";

export const Route = createFileRoute("/_app/submissions")({
  head: () => ({ meta: [{ title: "Auto Submissions · Invoice AI" }] }),
  component: SubmissionsPage,
});

function SubmissionsPage() {
  const { invoices } = useApp();
  const submitted = invoices.filter((i) => i.status === "auto_submitted");
  const failed = invoices.filter((i) => i.status === "submission_failed");
  // TODO: Trigger ECS Playwright auto-submission workflow
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Auto-Submission Logs</h1>
        <p className="text-sm text-muted-foreground">
          ECS Fargate Playwright agents pushing validated invoices to vendor portals.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Submitted Today" value={submitted.length * 8} icon={<CheckCircle2 className="h-4 w-4" />} accent="success" />
        <MetricCard title="Active Agents" value="6 / 8" icon={<Bot className="h-4 w-4" />} accent="primary" delta="ECS Fargate" />
        <MetricCard title="Avg Submit Time" value="14.2s" icon={<Send className="h-4 w-4" />} accent="info" />
        <MetricCard title="Retries" value={failed.length} icon={<RotateCcw className="h-4 w-4" />} accent="warning" />
      </div>
      <Card className="overflow-hidden p-0">
        <div className="border-b px-4 py-3 text-sm font-semibold">Submission log</div>
        <InvoiceTable invoices={[...submitted, ...failed]} />
      </Card>
    </div>
  );
}
