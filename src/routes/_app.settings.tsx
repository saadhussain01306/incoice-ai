import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/store/authStore";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_app/settings")({
  ssr: false,
  head: () => ({ meta: [{ title: "Settings · Invoice AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const [confidence, setConfidence] = useState("0.90");
  const [maxAmount, setMaxAmount] = useState("500000");
  const [blockDup, setBlockDup] = useState(true);
  const [captureCorrections, setCaptureCorrections] = useState(true);
  const [dirty, setDirty] = useState(false);

  const markDirty = () => setDirty(true);

  const handleSave = () => {
    setDirty(false);
    toast.success("Settings saved successfully", {
      description: "Auto-submission rules and thresholds updated.",
    });
  };

  const handleCancel = () => {
    if (dirty) {
      toast.message("Unsaved changes discarded", {
        description: "You exited without saving.",
      });
    }
    navigate({ to: "/" });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure thresholds, routing rules, and integrations.
        </p>
      </div>

      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-semibold">Auto-submission rules</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Confidence threshold</Label>
            <Input
              value={confidence}
              onChange={(e) => { setConfidence(e.target.value); markDirty(); }}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Max auto-submit amount (INR)</Label>
            <Input
              value={maxAmount}
              onChange={(e) => { setMaxAmount(e.target.value); markDirty(); }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <div className="text-sm font-medium">Block on duplicate detection</div>
            <div className="text-xs text-muted-foreground">Route to review if hash match found</div>
          </div>
          <Switch
            checked={blockDup}
            onCheckedChange={(v) => { setBlockDup(v); markDirty(); }}
          />
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <div className="text-sm font-medium">Capture reviewer corrections</div>
            <div className="text-xs text-muted-foreground">Feeds the AI learning loop</div>
          </div>
          <Switch
            checked={captureCorrections}
            onCheckedChange={(v) => { setCaptureCorrections(v); markDirty(); }}
          />
        </div>
      </Card>

      <Card className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Integrations</h3>
          {!isAdmin && (
            <Badge variant="outline" className="text-[10px]">
              Admin only — details hidden
            </Badge>
          )}
        </div>
        <Row label="Email ingestion" status="Connected" admin={isAdmin} hidden="••• mailbox configured" />
        <Row label="Document storage" status="Connected" admin={isAdmin} hidden="Object store configured" />
        <Row label="Vendor portal" status="Connected" admin={isAdmin} hidden="Portal endpoint configured" />
        <Row label="Extraction model" status="Active" admin={isAdmin} hidden="Managed AI model" />
        {isAdmin && (
          <p className="text-[11px] text-muted-foreground">
            Detailed connection identifiers are available in the internal operator console.
          </p>
        )}
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save changes</Button>
      </div>
    </div>
  );
}

function Row({
  label,
  status,
  admin,
  hidden,
}: {
  label: string;
  status: string;
  admin: boolean;
  hidden: string;
}) {
  return (
    <div className="flex items-center justify-between border-b py-2 last:border-0">
      <div className="text-sm">{label}</div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {admin ? hidden : "•••"}
        </span>
        <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
          {status}
        </Badge>
      </div>
    </div>
  );
}

