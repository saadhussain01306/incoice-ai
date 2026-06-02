import { Bell, Search, Sun, Moon } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useApp } from "@/store/appStore";
import { useEffect, useState } from "react";

export function TopBar() {
  const { invoices } = useApp();
  const processing = invoices.filter(
    (i) => i.status === "extracting" || i.status === "validating",
  ).length;
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

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
        <Button variant="ghost" size="icon" onClick={() => setDark((d) => !d)}>
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/20 text-xs text-primary">OK</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
