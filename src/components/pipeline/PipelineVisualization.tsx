import { Mail, FolderOpen, Upload, FileScan, ScanLine, LayoutTemplate, Brain, Target, Gauge, Scale, Calculator, Copy, Globe, Split, CheckCircle2, UserCheck, Bot, Database, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Node {
  icon: typeof Mail;
  label: string;
  active?: boolean;
  tone?: "ai" | "success" | "info" | "warning" | "default";
}

const stages: { title: string; nodes: Node[] }[] = [
  {
    title: "Sources",
    nodes: [
      { icon: Mail, label: "Email Inbox", active: true },
      { icon: FolderOpen, label: "Shared Drive" },
      { icon: Upload, label: "Manual Upload", active: true },
    ],
  },
  {
    title: "Document Pipeline",
    nodes: [
      { icon: FileScan, label: "PDF Parsing", tone: "info", active: true },
      { icon: ScanLine, label: "OCR Processing", tone: "info" },
      { icon: LayoutTemplate, label: "Layout Detection", tone: "info" },
    ],
  },
  {
    title: "AI Extraction",
    nodes: [
      { icon: Brain, label: "Bedrock AI", tone: "ai", active: true },
      { icon: Target, label: "Field Extraction", tone: "ai", active: true },
      { icon: Gauge, label: "Confidence Score", tone: "ai" },
    ],
  },
  {
    title: "Validation",
    nodes: [
      { icon: Scale, label: "Rule Validation", tone: "info" },
      { icon: Calculator, label: "Tax Validation", tone: "info" },
      { icon: Copy, label: "Duplicate Check", tone: "info" },
      { icon: Globe, label: "Portal Cross-Check", tone: "info" },
    ],
  },
  {
    title: "Routing",
    nodes: [
      { icon: Split, label: "Smart Router", active: true },
      { icon: CheckCircle2, label: "Auto Submit", tone: "success", active: true },
      { icon: UserCheck, label: "Human Review", tone: "warning" },
    ],
  },
  {
    title: "Actions",
    nodes: [
      { icon: Bot, label: "ECS Playwright", tone: "success", active: true },
      { icon: Database, label: "Audit Trail", tone: "info" },
      { icon: Sparkles, label: "Feedback Loop", tone: "ai" },
    ],
  },
];

const toneCls = {
  ai: "border-ai/30 bg-ai/10 text-ai",
  success: "border-success/30 bg-success/10 text-success",
  info: "border-info/30 bg-info/10 text-info",
  warning: "border-warning/30 bg-warning/10 text-warning",
  default: "border-border bg-card text-foreground",
};

export function PipelineVisualization() {
  return (
    <div className="relative overflow-x-auto rounded-lg border bg-card/40 grid-bg p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Live Automation Pipeline</h3>
          <p className="text-xs text-muted-foreground">
            End-to-end flow: ingestion → extraction → validation → action
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          Realtime
        </div>
      </div>
      <div className="flex min-w-[1100px] items-stretch gap-2">
        {stages.map((stage, si) => (
          <div key={stage.title} className="flex flex-1 items-center gap-2">
            <div className="flex-1 space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {stage.title}
              </div>
              <div className="space-y-1.5">
                {stage.nodes.map((n) => (
                  <div
                    key={n.label}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs transition-colors",
                      toneCls[n.tone ?? "default"],
                      n.active && "shadow-[0_0_0_1px_currentColor]",
                    )}
                  >
                    <n.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{n.label}</span>
                    {n.active && (
                      <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-current text-current pulse-dot" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            {si < stages.length - 1 && (
              <svg className="h-16 w-6 shrink-0 text-muted-foreground/40" viewBox="0 0 24 64">
                <path
                  d="M 0 32 L 24 32"
                  className="flow-line stroke-current"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path d="M 18 26 L 24 32 L 18 38" stroke="currentColor" fill="none" strokeWidth="1.5" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
