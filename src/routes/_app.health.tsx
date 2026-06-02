import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/MetricCard";
import { Activity, Cloud, Database, Bot, Zap } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/health")({
  head: () => ({ meta: [{ title: "System Health · Invoice AI" }] }),
  component: HealthPage,
});

const latency = Array.from({ length: 30 }, (_, i) => ({
  t: i,
  bedrock: 320 + Math.round(Math.sin(i / 3) * 80 + Math.random() * 60),
  lambda: 90 + Math.round(Math.cos(i / 4) * 30 + Math.random() * 25),
}));

const services = [
  { name: "API Gateway", status: "operational", uptime: "99.99%" },
  { name: "Lambda: ingest-fn", status: "operational", uptime: "100%" },
  { name: "Lambda: extract-fn", status: "operational", uptime: "99.97%" },
  { name: "AWS Bedrock", status: "operational", uptime: "99.95%" },
  { name: "Step Functions", status: "operational", uptime: "100%" },
  { name: "DynamoDB · audit-trail", status: "operational", uptime: "100%" },
  { name: "ECS Fargate · playwright", status: "degraded", uptime: "98.4%" },
  { name: "S3 · invoice-uploads", status: "operational", uptime: "100%" },
];

const tone = {
  operational: "bg-success/15 text-success border-success/30",
  degraded: "bg-warning/15 text-warning border-warning/30",
  down: "bg-destructive/15 text-destructive border-destructive/30",
} as const;

function HealthPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System Health</h1>
        <p className="text-sm text-muted-foreground">
          Realtime status of every AWS component in the pipeline.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Overall SLA" value="99.94%" delta="30-day rolling" accent="success" icon={<Activity className="h-4 w-4" />} />
        <MetricCard title="Bedrock Latency" value="412ms" delta="p95 · normal" accent="ai" icon={<Zap className="h-4 w-4" />} />
        <MetricCard title="Queue Depth" value="14" delta="Step Functions" accent="info" icon={<Cloud className="h-4 w-4" />} />
        <MetricCard title="Failed Submissions" value={3} delta="auto-retry scheduled" accent="warning" icon={<Bot className="h-4 w-4" />} />
      </div>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Latency · Bedrock vs Lambda (ms)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={latency}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="t" stroke="var(--muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} />
            <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
            <Line dataKey="bedrock" stroke="var(--ai)" strokeWidth={2} dot={false} />
            <Line dataKey="lambda" stroke="var(--info)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b px-4 py-3 text-sm font-semibold">Services</div>
        <div className="divide-y">
          {services.map((s) => (
            <div key={s.name} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{s.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs tabular-nums text-muted-foreground">{s.uptime}</span>
                <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] capitalize", tone[s.status as keyof typeof tone])}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
