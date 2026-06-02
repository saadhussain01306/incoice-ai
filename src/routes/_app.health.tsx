import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/MetricCard";
import { Activity, Cloud, Server, Bot, Zap } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/authStore";

export const Route = createFileRoute("/_app/health")({
  ssr: false,
  head: () => ({ meta: [{ title: "System Health · Invoice AI" }] }),
  component: HealthPage,
});

const latency = Array.from({ length: 30 }, (_, i) => ({
  t: i,
  extraction: 320 + Math.round(Math.sin(i / 3) * 80 + ((i * 53) % 60)),
  ingestion: 90 + Math.round(Math.cos(i / 4) * 30 + ((i * 31) % 25)),
}));

// User-friendly component labels. Internal infrastructure identifiers
// (Lambda names, bucket paths, ECS service names, etc.) are intentionally
// not exposed here — see operator console for engineering-level details.
const components = [
  { name: "Ingestion API", status: "operational", uptime: "99.99%" },
  { name: "Document Processing", status: "operational", uptime: "100%" },
  { name: "AI Extraction", status: "operational", uptime: "99.95%" },
  { name: "Validation Engine", status: "operational", uptime: "100%" },
  { name: "Audit Logging", status: "operational", uptime: "100%" },
  { name: "Auto-Submission", status: "degraded", uptime: "98.4%" },
  { name: "Document Storage", status: "operational", uptime: "100%" },
];

const tone = {
  operational: "bg-success/15 text-success border-success/30",
  degraded: "bg-warning/15 text-warning border-warning/30",
  down: "bg-destructive/15 text-destructive border-destructive/30",
} as const;

function HealthPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System Health</h1>
        <p className="text-sm text-muted-foreground">
          Realtime operational status across the platform.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Overall SLA" value="99.94%" delta="30-day rolling" accent="success" icon={<Activity className="h-4 w-4" />} />
        <MetricCard title="Extraction Latency" value="412ms" delta="p95 · normal" accent="ai" icon={<Zap className="h-4 w-4" />} />
        <MetricCard title="Queue Depth" value="14" delta="processing pipeline" accent="info" icon={<Cloud className="h-4 w-4" />} />
        <MetricCard title="Failed Submissions" value={3} delta="auto-retry scheduled" accent="warning" icon={<Bot className="h-4 w-4" />} />
      </div>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Latency · Extraction vs Ingestion (ms)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={latency}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="t" stroke="var(--muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} />
            <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
            <Line dataKey="extraction" stroke="var(--ai)" strokeWidth={2} dot={false} />
            <Line dataKey="ingestion" stroke="var(--info)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">Platform components</span>
          {!isAdmin && (
            <span className="text-[11px] text-muted-foreground">
              Internal service identifiers visible to operators only
            </span>
          )}
        </div>
        <div className="divide-y">
          {components.map((s) => (
            <div key={s.name} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex items-center gap-3">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{s.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs tabular-nums text-muted-foreground">{s.uptime}</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] capitalize",
                    tone[s.status as keyof typeof tone],
                  )}
                >
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
