import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { MetricCard } from "@/components/shared/MetricCard";
import { PipelineVisualization } from "@/components/pipeline/PipelineVisualization";
import { InvoiceTable } from "@/components/shared/InvoiceTable";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Database,
  Bot,
  ArrowRight,
} from "lucide-react";
import { useApp } from "@/store/appStore";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Invoice AI" },
      { name: "description", content: "AI invoice validation & auto-submission control center." },
    ],
  }),
  component: DashboardPage,
});

const spark = Array.from({ length: 14 }, (_, i) => ({
  v: 200 + Math.round(Math.sin(i / 2) * 40 + i * 8 + Math.random() * 30),
}));

function DashboardPage() {
  const { invoices } = useApp();
  const navigate = useNavigate();
  const auto = invoices.filter((i) => i.status === "auto_submitted").length;
  const flagged = invoices.filter((i) => i.status === "human_review").length;
  const avgConf = invoices.reduce((s, i) => s + i.confidence, 0) / invoices.length;
  const autoRate = (auto / invoices.length) * 100;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Operations Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Live status of the AI-powered invoice validation & auto-submission agent.
          </p>
        </div>
        <Button onClick={() => navigate({ to: "/queue" })}>
          Open queue <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="Invoices Processed"
          value="12,487"
          delta="+184 today · +9.2% WoW"
          deltaTone="positive"
          icon={<FileText className="h-4 w-4" />}
          accent="primary"
          footer={
            <ResponsiveContainer width="100%" height={36}>
              <AreaChart data={spark}>
                <defs>
                  <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area dataKey="v" stroke="var(--primary)" fill="url(#g1)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          }
        />
        <MetricCard
          title="Auto-Submitted"
          value={`${autoRate.toFixed(0)}%`}
          delta="Target: 80% · on track"
          deltaTone="positive"
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent="success"
          footer={
            <div className="space-y-1.5">
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-success transition-all"
                  style={{ width: `${autoRate}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px]">
                <span>{auto} this batch</span>
                <span className="text-success">SLA met</span>
              </div>
            </div>
          }
        />
        <MetricCard
          title="Flagged for Review"
          value={flagged}
          delta="3 high-priority pending"
          deltaTone="negative"
          icon={<AlertTriangle className="h-4 w-4" />}
          accent="warning"
        />
        <MetricCard
          title="Avg AI Confidence"
          value={`${(avgConf * 100).toFixed(1)}%`}
          delta="Bedrock extraction"
          icon={<Sparkles className="h-4 w-4" />}
          accent="ai"
          footer={
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-ai"
                style={{ width: `${avgConf * 100}%` }}
              />
            </div>
          }
        />
        <MetricCard
          title="Audit Logging"
          value="Healthy"
          delta="Realtime DynamoDB stream active"
          deltaTone="positive"
          icon={<Database className="h-4 w-4" />}
          accent="info"
          footer={
            <ResponsiveContainer width="100%" height={36}>
              <LineChart data={spark}>
                <Line
                  dataKey="v"
                  stroke="var(--info)"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          }
        />
        <MetricCard
          title="ECS Automation"
          value="6 agents"
          delta="14 jobs queued · 0 failures"
          deltaTone="positive"
          icon={<Bot className="h-4 w-4" />}
          accent="success"
        />
      </div>

      <PipelineVisualization />

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold">Recent invoice activity</h3>
            <p className="text-xs text-muted-foreground">
              Click any row to open the review workspace
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/queue" })}>
            View all
          </Button>
        </div>
        <InvoiceTable
          invoices={invoices.slice(0, 8)}
          onRowClick={() => navigate({ to: "/review" })}
        />
      </Card>
    </div>
  );
}
