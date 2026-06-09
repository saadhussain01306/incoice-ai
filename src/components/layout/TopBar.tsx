import { Bell, Search, Sun, Moon, LogOut, UserCircle, AlertTriangle, CheckCircle2, Sparkles, Info } from "lucide-react";
import { toast } from "sonner";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/store/appStore";
import { useAuth } from "@/store/authStore";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const THEME_KEY = "invoice-ai.theme";

export function TopBar() {
  const { invoices } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const processing = invoices.filter(
    (i) => i.status === "extracting" || i.status === "validating",
  ).length;

  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === "dark") return true;
    if (stored === "light") return false;
    return false; // Schneider default: light theme
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      window.localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }, [dark]);

  const initials = (user?.name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const notifications = useMemo(() => {
    const review = invoices.filter((i) => i.status === "human_review").slice(0, 3);
    const failed = invoices.filter((i) => i.status === "submission_failed").slice(0, 2);
    const submitted = invoices.filter((i) => i.status === "auto_submitted").slice(0, 2);
    return [
      ...failed.map((i) => ({
        id: `f-${i.id}`,
        icon: AlertTriangle,
        tone: "destructive" as const,
        title: `Submission failed · ${i.id}`,
        desc: i.reason ?? "Playwright submission failed at vendor portal.",
      })),
      ...review.map((i) => ({
        id: `r-${i.id}`,
        icon: Sparkles,
        tone: "ai" as const,
        title: `Review needed · ${i.id}`,
        desc: i.reason ?? `Confidence ${(i.confidence * 100).toFixed(0)}% — please verify.`,
      })),
      ...submitted.map((i) => ({
        id: `s-${i.id}`,
        icon: CheckCircle2,
        tone: "success" as const,
        title: `Auto-submitted · ${i.id}`,
        desc: `${i.vendor} submitted to portal successfully.`,
      })),
      {
        id: "sys-1",
        icon: Info,
        tone: "info" as const,
        title: "Model refreshed",
        desc: "Extraction model updated with 142 new feedback samples.",
      },
    ];
  }, [invoices]);

  const unread = notifications.length;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md">
      <SidebarTrigger />
      <div className="relative hidden flex-1 max-w-md md:block">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search invoices, vendors, IDs…"
          className="h-9 pl-8 bg-muted/40 border-border"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-xs md:flex">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="text-muted-foreground">Live</span>
        </div>
        <Badge
          variant="outline"
          className="hidden border-info/30 bg-info/10 text-info md:inline-flex"
        >
          {processing} processing
        </Badge>
        <Badge
          variant="outline"
          className="hidden border-success/30 bg-success/10 text-success md:inline-flex"
        >
          AI: Healthy
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDark((d) => !d)}
          aria-label="Toggle theme"
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-semibold text-destructive-foreground">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[360px] p-0">
            <div className="flex items-center justify-between border-b px-3 py-2.5">
              <div className="text-sm font-semibold">Notifications</div>
              <Badge variant="outline" className="text-[10px]">
                {unread} new
              </Badge>
            </div>
            <ScrollArea className="max-h-[360px]">
              <ul className="divide-y">
                {notifications.map((n) => {
                  const Icon = n.icon;
                  const toneClass =
                    n.tone === "destructive"
                      ? "bg-destructive/15 text-destructive"
                      : n.tone === "success"
                        ? "bg-success/15 text-success"
                        : n.tone === "ai"
                          ? "bg-ai/15 text-ai"
                          : "bg-info/15 text-info";
                  return (
                    <li key={n.id} className="flex gap-3 px-3 py-2.5 hover:bg-accent/60">
                      <div className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md", toneClass)}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{n.title}</div>
                        <div className="line-clamp-2 text-xs text-muted-foreground">{n.desc}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
            <div className="border-t px-3 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-xs"
                onClick={() => navigate({ to: "/review" })}
              >
                View review queue
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/20 text-xs text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-medium">{user?.name}</div>
              <div className="text-[11px] font-normal text-muted-foreground">
                {user?.email}
              </div>
              <Badge
                variant="outline"
                className="mt-1.5 text-[10px] capitalize"
              >
                {user?.role}
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
              <UserCircle className="mr-2 h-4 w-4" /> Account
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                logout();
                toast.success("Signed out", { description: "You have been logged out successfully." });
                navigate({ to: "/login", replace: true });
              }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
