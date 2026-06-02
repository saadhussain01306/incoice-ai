import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { InvoiceTable } from "@/components/shared/InvoiceTable";
import { useApp } from "@/store/appStore";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  FileText,
  Brain,
  Sparkles,
  CheckCircle2,
  XCircle,
  Undo2,
  ShieldAlert,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { StatusPill } from "@/components/shared/StatusPill";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ExtractedFields, Invoice } from "@/types/invoice";

export const Route = createFileRoute("/_app/review")({
  head: () => ({ meta: [{ title: "Human Review · Invoice AI" }] }),
  component: ReviewPage,
});

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function ReviewPage() {
  const { invoices } = useApp();
  const navigate = useNavigate();
  const flagged = invoices.filter((i) => i.status === "human_review" || i.status === "submission_failed");
  const [selectedId, setSelectedId] = useState<string | null>(flagged[0]?.id ?? null);
  const selected = invoices.find((i) => i.id === selectedId) ?? flagged[0];

  if (!selected) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
        <h2 className="mt-3 text-lg font-semibold">All clear</h2>
        <p className="text-sm text-muted-foreground">No invoices currently require human review.</p>
        <Button className="mt-4" onClick={() => navigate({ to: "/queue" })}>
          Back to queue
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Human Review Workspace</h1>
          <p className="text-sm text-muted-foreground">
            Validate AI extractions against the vendor portal and approve, override, or reject.
          </p>
        </div>
        <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
          <AlertTriangle className="mr-1 h-3 w-3" /> {flagged.length} awaiting review
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="overflow-hidden p-0">
          <div className="border-b px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Review queue
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {flagged.map((inv) => (
              <button
                key={inv.id}
                onClick={() => setSelectedId(inv.id)}
                className={cn(
                  "block w-full border-b px-3 py-3 text-left transition-colors hover:bg-accent/60",
                  selected.id === inv.id && "bg-accent",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs">{inv.id}</span>
                  <StatusPill status={inv.status} />
                </div>
                <div className="mt-1 text-sm font-medium">{inv.vendor}</div>
                <div className="mt-0.5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{fmt(inv.amount)}</span>
                  <span>{(inv.confidence * 100).toFixed(0)}% conf</span>
                </div>
                {inv.reason && (
                  <div className="mt-1.5 line-clamp-1 text-[11px] text-destructive">
                    {inv.reason}
                  </div>
                )}
              </button>
            ))}
          </div>
        </Card>

        <ReviewWorkspace key={selected.id} invoice={selected} />
      </div>
    </div>
  );
}

function ReviewWorkspace({ invoice }: { invoice: ReturnType<typeof useApp>["invoices"][number] }) {
  const [overrideOpen, setOverrideOpen] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"submit" | "reprocess" | "escalate" | null>(null);

  const openConfirm = (action: "submit" | "reprocess" | "escalate") => {
    setConfirmAction(action);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    if (confirmAction === "submit") {
      toast.success(`${invoice.id}: submitted to vendor portal`, {
        description: "Playwright automation will complete the submission.",
      });
    } else if (confirmAction === "reprocess") {
      toast.message(`${invoice.id}: queued for re-extraction`, {
        description: "AI pipeline will re-run OCR and field extraction.",
      });
    } else if (confirmAction === "escalate") {
      toast.warning(`${invoice.id}: escalated to finance lead`, {
        description: "The reviewer team will be notified.",
      });
    }
    setConfirmAction(null);
  };

  const handleReject = () => {
    toast.error(`${invoice.id}: rejected and archived`, {
      description: "Invoice will not be submitted. Audit trail logged.",
    });
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{invoice.id}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{invoice.vendor}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="h-7 w-7"><ZoomOut className="h-3.5 w-3.5" /></Button>
            <span className="text-xs tabular-nums text-muted-foreground">100%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7"><ZoomIn className="h-3.5 w-3.5" /></Button>
            <span className="mx-1 h-4 w-px bg-border" />
            <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronLeft className="h-3.5 w-3.5" /></Button>
            <span className="text-xs text-muted-foreground">1 / 1</span>
            <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronRight className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
        {/* TODO: Integrate OCR bounding box coordinates from Bedrock/Textract API */}
        <div className="relative grid-bg min-h-[360px] bg-muted/20 p-6">
          <div className="mx-auto aspect-[8.5/11] max-w-md rounded-md border bg-card p-6 shadow-sm">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Tax Invoice</div>
            <div className="mt-1 text-lg font-semibold">{invoice.vendor}</div>
            <div className="mt-4 grid grid-cols-2 gap-y-3 text-sm">
              <BoundingField label="Invoice #" value={invoice.extracted.invoiceNumber} confidence={0.98} />
              <BoundingField label="Date" value={invoice.extracted.invoiceDate} confidence={0.95} />
              <BoundingField label="GSTIN" value={invoice.extracted.gstNumber} confidence={0.82} mismatch={invoice.mismatches.some(m => m.includes("GST"))} />
              <BoundingField label="Tax Rate" value={`${invoice.extracted.taxRate}%`} confidence={0.79} mismatch={invoice.mismatches.some(m => m.includes("GST"))} />
              <BoundingField label="Subtotal" value={fmt(invoice.extracted.subtotal)} confidence={0.94} />
              <BoundingField label="Total" value={fmt(invoice.extracted.totalAmount)} confidence={0.97} mismatch={invoice.mismatches.some(m => m.includes("amount"))} />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-ai/15 text-ai">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-sm font-semibold">AI Extracted</h3>
            </div>
            <Badge variant="outline" className="border-ai/30 bg-ai/10 text-ai">
              {(invoice.confidence * 100).toFixed(1)}% conf
            </Badge>
          </div>
          <FieldList fields={invoice.extracted} mismatches={invoice.mismatches} side="ai" portal={invoice.portal} />
        </Card>
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-info/15 text-info">
                <ShieldAlert className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-sm font-semibold">Portal Reference</h3>
            </div>
            <Badge variant="outline" className="border-info/30 bg-info/10 text-info">
              Source of truth
            </Badge>
          </div>
          <FieldList fields={invoice.portal} mismatches={invoice.mismatches} side="portal" portal={invoice.portal} />
        </Card>
      </div>

      {invoice.mismatches.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div>
              <div className="text-sm font-semibold text-destructive">Validation mismatches detected</div>
              <ul className="mt-1 list-disc pl-4 text-xs text-destructive/90">
                {invoice.mismatches.map((m) => <li key={m}>{m}</li>)}
              </ul>
            </div>
          </div>
        </Card>
      )}

      <Card className="border-ai/30 bg-ai/5 p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-ai/15 text-ai">
            <Brain className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">AI Reasoning · Bedrock</h3>
              <Badge variant="outline" className="border-ai/30 bg-ai/10 text-ai text-[10px]">
                claude-3.5-sonnet
              </Badge>
            </div>
            <p className="mt-1 text-sm text-foreground/90">{invoice.aiExplanation}</p>
          </div>
        </div>
      </Card>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <Button onClick={() => openConfirm("submit")}>
          <CheckCircle2 className="mr-1.5 h-4 w-4" /> Accept AI & Submit
        </Button>
        <Button
          variant="outline"
          onClick={() => setOverrideOpen(true)}
        >
          <Pencil className="mr-1.5 h-4 w-4" /> Override values
        </Button>
        <Button
          variant="outline"
          onClick={() => openConfirm("reprocess")}
        >
          <Undo2 className="mr-1.5 h-4 w-4" /> Reprocess
        </Button>
        <Button
          variant="ghost"
          className="text-warning"
          onClick={() => openConfirm("escalate")}
        >
          <ShieldAlert className="mr-1.5 h-4 w-4" /> Escalate
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="ml-auto">
              <XCircle className="mr-1.5 h-4 w-4" /> Reject
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Reject this invoice?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently reject <span className="font-mono">{invoice.id}</span> from{
