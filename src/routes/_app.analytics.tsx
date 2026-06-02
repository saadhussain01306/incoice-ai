import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/MetricCard";
import { Sparkles, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics · Invoice AI" }] }),
  component: AnalyticsPage,
});

const trend = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  auto: 60 + Math.round(Math.sin(i / 2) * 8 + i * 1.5),
  review: 14 + Math.round(Math.cos(i / 3) * 4),
}));

const vendors = [
  { v: "ABC Mfg", mismatches: 12 },
  { v: "Crestline", mismatches: 7 },
  { v: "Helix", mismatches: 9 },
  { v: "Northwind", mismatches: 4 },
  { v: "Orbit", mismatches: 2 },
  { v: "Sunrise", mismatches: 6 },
];

const confidenceDist = [
  { bucket: "<70%", n: 8 },
  { bucket: "70–80", n: 14 },
  { bucket: "80–90", n: 42 },
  { bucket: "90–95", n: 88 },
  { bucket: "95–100", n: 156 },
];

const errors = [
  { name: "GST mismatch", value: 34, color: "var(--destructive)" },
  { name: "Amount mismatch", value: 22, color: "var(--warning)" },
  { name: "Duplicate", value: 14, color: "var(--ai)" },
  { name: "Portal 5xx", value: 9, color: "var(--info)" },
];

function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Trends across automation rate, review load, vendor mismatches, and AI confidence.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Monthly Volume" value="12,487" delta="+9.2% MoM" deltaTone="positive" icon={<TrendingUp className="h-4 w-4" />} accent="primary" />
        <MetricCard title="Auto-Submit Rate" value="82%" delta="Target 80% ✓" deltaTone="positive" accent="success" />
        <MetricCard title="Review Rate" value="18%" delta="-1.4% WoW" deltaTone="positive" accent="warning" />
        <MetricCard title="Model Drift" value="None" delta="confidence stable" accent="ai" icon={<Sparkles className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold">Auto-submission vs Human review</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="ga" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--success)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gb" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--destructive)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--destructive)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Area dataKey="auto" stroke="var(--success)" fill="url(#ga)" strokeWidth={2} />
              <Area dataKey="review" stroke="var(--destructive)" fill="url(#gb)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Error category breakdown</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={errors} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {errors.map((e) => <Cell key={e.name} fill={e.color} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold">Vendor-wise mismatches</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={vendors}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="v" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="mismatches" fill="var(--warning)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">AI confidence distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={confidenceDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="bucket" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="n" fill="var(--ai)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="border-ai/30 bg-ai/5 p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-ai/15 text-ai">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Feedback Learning Loop</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Reviewer corrections are stored and used to fine-tune extraction prompts.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <LearningStat label="Corrections captured" value="412" />
              <LearningStat label="Prompt updates" value="7" />
              <LearningStat label="GST accuracy" value="84% → 92%" tone="success" />
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={trend}>
                <Line dataKey="auto" stroke="var(--ai)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </div>
  );
}

function LearningStat({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return (
    <div className="rounded-md border bg-card/50 p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${tone === "success" ? "text-success" : ""}`}>{value}</div>
    </div>
  );
}
