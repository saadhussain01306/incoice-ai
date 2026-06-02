import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings · Invoice AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
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
            <Input defaultValue="0.90" />
          </div>
          <div className="space-y-1.5">
            <Label>Max auto-submit amount (INR)</Label>
            <Input defaultValue="500000" />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <div className="text-sm font-medium">Block on duplicate detection</div>
            <div className="text-xs text-muted-foreground">Route to review if hash match found</div>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <div className="text-sm font-medium">Capture reviewer corrections</div>
            <div className="text-xs text-muted-foreground">Used by Bedrock feedback learning loop</div>
          </div>
          <Switch defaultChecked />
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-semibold">Integrations</h3>
        <Row label="Email ingestion" value="invoices@finops.acme.io" />
        <Row label="Shared drive" value="s3://acme-invoice-drop" />
        <Row label="Vendor portal" value="https://portal.vendor.acme/api" />
        <Row label="Bedrock model" value="anthropic.claude-3-5-sonnet-v2" />
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Save changes</Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b py-2 last:border-0">
      <div className="text-sm">{label}</div>
      <div className="font-mono text-xs text-muted-foreground">{value}</div>
    </div>
  );
}
