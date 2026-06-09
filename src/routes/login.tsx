import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AuthProvider, useAuth } from "@/store/authStore";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import seLogo from "@/assets/se-logo.png.asset.json";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign in · InvoiceAI-mySchneider" }] }),
  component: () => (
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  ),
});

function LoginPage() {
  const { user, ready, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("reviewer@schneider-electric.com");
  const [password, setPassword] = useState("demo");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && user) navigate({ to: "/", replace: true });
  }, [ready, user, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Signed in successfully", { description: `Welcome back, ${email}.` });
      navigate({ to: "/", replace: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background grid-bg p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-6 flex items-center gap-2">
          <img
            src={seLogo.url}
            alt="Schneider Electric"
            width={36}
            height={36}
            className="h-9 w-9 rounded-md"
          />
          <div className="leading-tight">
            <div className="text-sm font-semibold">InvoiceAI-mySchneider</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Schneider Electric · Operations Console
            </div>
          </div>
        </div>
        <h1 className="text-lg font-semibold">Sign in</h1>
        <p className="mb-5 text-xs text-muted-foreground">
          Demo gate — any email and password will sign you in.
        </p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Corporate email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {err && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {err}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            <Lock className="mr-1.5 h-4 w-4" />
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Tip: use <code className="text-foreground">admin@schneider-electric.com</code> for admin role.
        </p>
        <p className="mt-3 text-center text-[10px] text-muted-foreground">
          © {new Date().getFullYear()} Schneider Electric · Internal Use Only
        </p>
      </Card>
    </div>
  );
}
