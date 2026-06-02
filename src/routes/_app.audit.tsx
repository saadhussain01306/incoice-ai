import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { mockAudit } from "@/mock/invoices";
import { Search, Download, CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/audit")({
  head: () => ({ meta: [{ title: "Audit Trail · Invoice AI" }] }),
  component: AuditPage,
});

const statusIcon = {
  success: { icon: CheckCircle2, cls: "text-success bg-success/15" },
  warning: { icon: AlertTriangle, cls: "text-warning bg-warning/15" },
  error: { icon: XCircle, cls: "text-destructive bg-destructive/15" },
  info: { icon: Info, cls: "text-info bg-info/15" },
};

function AuditPage() {
  const [q, setQ] = useState("");
  // TODO: Fetch DynamoDB audit logs via /audit endpoint (paginated)
  const events = mockAudit
    .filter(
      (e) =>
        e.invoiceId.toLowerCase().includes(q.toLowerCase()) ||
        e.action.toLowerCase().includes(q.toLowerCase()) ||
        e.actor.toLowerCase().includes(q.toLowerCase()),
    )
    .slice(0, 60);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit Trail</h1>
          <p className="text-sm text-muted-foreground">
            Immutable DynamoDB log of every pipeline event, user action, and system call.
          </p>
        </div>
        <Button variant="outline" onClick={() => toast.success("Audit trail exported", { description: "CSV download started with 60 most recent events." })}>
          <Download className="mr-1.5 h-4 w-4" /> Export
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between gap-3 border-b p-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter by invoice, actor, action…"
              className="h-9 pl-8"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Streaming
          </div>
        </div>
        <ol className="relative">
          {events.map((e) => {
            const S = statusIcon[e.status];
            return (
              <li key={e.id} className="flex gap-4 border-b px-4 py-3 last:border-0 hover:bg-accent/40">
                <div className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full", S.cls)}>
                  <S.icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
                    <span className="font-mono text-xs text-muted-foreground">{e.invoiceId}</span>
                    <span className="font-medium">{e.action}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {e.actor} · {new Date(e.timestamp).toLocaleString()}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}
