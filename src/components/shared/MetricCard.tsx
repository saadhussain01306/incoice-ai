import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface Props {
  title: string;
  value: ReactNode;
  delta?: string;
  deltaTone?: "positive" | "negative" | "neutral";
  icon?: ReactNode;
  footer?: ReactNode;
  accent?: "primary" | "success" | "warning" | "ai" | "info";
}

export function MetricCard({
  title,
  value,
  delta,
  deltaTone = "neutral",
  icon,
  footer,
  accent = "primary",
}: Props) {
  const accentMap = {
    primary: "from-primary/10",
    success: "from-success/10",
    warning: "from-warning/10",
    ai: "from-ai/10",
    info: "from-info/10",
  } as const;
  const iconBg = {
    primary: "bg-primary/15 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    ai: "bg-ai/15 text-ai",
    info: "bg-info/15 text-info",
  } as const;
  return (
    <Card
      className={cn(
        "relative overflow-hidden bg-gradient-to-br to-card/0 p-5",
        accentMap[accent],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <div className="text-2xl font-semibold tabular-nums">{value}</div>
          {delta && (
            <p
              className={cn(
                "text-xs",
                deltaTone === "positive" && "text-success",
                deltaTone === "negative" && "text-destructive",
                deltaTone === "neutral" && "text-muted-foreground",
              )}
            >
              {delta}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn("grid h-9 w-9 place-items-center rounded-md", iconBg[accent])}>
            {icon}
          </div>
        )}
      </div>
      {footer && <div className="mt-4 text-xs text-muted-foreground">{footer}</div>}
    </Card>
  );
}
