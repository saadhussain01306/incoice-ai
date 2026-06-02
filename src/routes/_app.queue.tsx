import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { InvoiceTable } from "@/components/shared/InvoiceTable";
import { useApp } from "@/store/appStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Upload, Cloud, FileUp, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_app/queue")({
  head: () => ({ meta: [{ title: "Invoice Queue · Invoice AI" }] }),
  component: QueuePage,
});

function QueuePage() {
  const { invoices, enqueueUpload, uploadQueue } = useApp();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = invoices.filter(
    (i) =>
      i.id.toLowerCase().includes(q.toLowerCase()) ||
      i.vendor.toLowerCase().includes(q.toLowerCase()),
  );

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    // TODO: POST /invoices/upload (multipart) → S3 presigned URL → Step Functions
    enqueueUpload(arr);
    toast.success(`${arr.length} file(s) queued for processing`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invoice Queue</h1>
        <p className="text-sm text-muted-foreground">
          Upload, monitor, and triage incoming invoices from all sources.
        </p>
      </div>

      <Card
        className={`relative border-dashed p-6 transition-colors ${drag ? "border-primary bg-primary/5" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary">
            <Cloud className="h-6 w-6" />
          </div>
          <div>
            <p className="font-medium">Drag & drop invoices, or click to browse</p>
            <p className="text-xs text-muted-foreground">
              PDF · PNG · JPG · up to 25 MB · multi-file supported
            </p>
          </div>
          <Button onClick={() => fileRef.current?.click()}>
            <FileUp className="mr-1.5 h-4 w-4" /> Browse files
          </Button>
          <input
            ref={fileRef}
            type="file"
            multiple
            hidden
            accept=".pdf,image/*"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </Card>

      {uploadQueue.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Upload queue</h3>
          <div className="space-y-2">
            {uploadQueue.slice(0, 5).map((u) => (
              <div key={u.name} className="flex items-center gap-3">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 truncate text-sm">{u.name}</div>
                <Progress value={u.progress} className="h-1.5 w-40" />
                <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
                  {u.status === "done" ? "done" : `${Math.round(u.progress)}%`}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between gap-3 border-b p-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search invoice ID or vendor…"
              className="h-9 pl-8"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Live stream
          </div>
        </div>
        <InvoiceTable
          invoices={filtered}
          onRowClick={() => navigate({ to: "/review" })}
        />
      </Card>
    </div>
  );
}
