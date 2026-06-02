import { Link } from "@tanstack/react-router";
import type { Invoice } from "@/types/invoice";
import { StatusPill } from "@/components/shared/StatusPill";
import { Mail, FolderOpen, Upload, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const sourceIcon = { email: Mail, shared_drive: FolderOpen, manual_upload: Upload };

function fmtMoney(n: number, ccy = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(n);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function InvoiceTable({
  invoices,
  compact,
  onRowClick,
  selectedId,
}: {
  invoices: Invoice[];
  compact?: boolean;
  onRowClick?: (inv: Invoice) => void;
  selectedId?: string | null;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2 font-medium">Invoice</th>
            <th className="px-4 py-2 font-medium">Vendor</th>
            <th className="px-4 py-2 font-medium">Amount</th>
            {!compact && <th className="px-4 py-2 font-medium">Uploaded</th>}
            <th className="px-4 py-2 font-medium">Confidence</th>
            <th className="px-4 py-2 font-medium">Status</th>
            {!compact && <th className="px-4 py-2 font-medium">Source</th>}
            {!compact && <th className="px-4 py-2 font-medium">Reviewer</th>}
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const SIcon = sourceIcon[inv.source];
            const active = selectedId === inv.id;
            const Row = (
              <>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    {inv.priority === "high" && (
                      <Flame className="h-3 w-3 text-destructive" />
                    )}
                    {inv.id}
                  </div>
                </td>
                <td className="px-4 py-3">{inv.vendor}</td>
                <td className="px-4 py-3 tabular-nums">{fmtMoney(inv.amount)}</td>
                {!compact && (
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {timeAgo(inv.uploadedAt)}
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          inv.confidence > 0.9
                            ? "bg-success"
                            : inv.confidence > 0.75
                              ? "bg-warning"
                              : "bg-destructive",
                        )}
                        style={{ width: `${inv.confidence * 100}%` }}
                      />
                    </div>
                    <span className="tabular-nums text-xs">
                      {(inv.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={inv.status} />
                </td>
                {!compact && (
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <SIcon className="h-3.5 w-3.5" />
                      {inv.source.replace("_", " ")}
                    </span>
                  </td>
                )}
                {!compact && (
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {inv.assignedTo ?? "—"}
                  </td>
                )}
              </>
            );
            return (
              <tr
                key={inv.id}
                onClick={() => onRowClick?.(inv)}
                className={cn(
                  "border-b transition-colors hover:bg-accent/50",
                  onRowClick && "cursor-pointer",
                  active && "bg-accent",
                )}
              >
                {Row}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
