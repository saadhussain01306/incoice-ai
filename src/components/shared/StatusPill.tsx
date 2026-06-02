import type { InvoiceStatus } from "@/types/invoice";
import { cn } from "@/lib/utils";

const map: Record<InvoiceStatus, { label: string; cls: string }> = {
  auto_submitted: {
    label: "Auto Submitted",
    cls: "bg-success/10 text-success border-success/20",
  },
  extracting: { label: "Extracting", cls: "bg-ai/10 text-ai border-ai/20" },
  validating: { label: "Validating", cls: "bg-info/10 text-info border-info/20" },
  human_review: {
    label: "Human Review",
    cls: "bg-destructive/10 text-destructive border-destructive/20",
  },
  submission_failed: {
    label: "Submission Failed",
    cls: "bg-destructive/15 text-destructive border-destructive/30",
  },
  pending_retry: {
    label: "Pending Retry",
    cls: "bg-warning/10 text-warning border-warning/20",
  },
};

export function StatusPill({ status, className }: { status: InvoiceStatus; className?: string }) {
  const m = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        m.cls,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {m.label}
    </span>
  );
}
