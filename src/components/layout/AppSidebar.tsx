import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Inbox,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Send,
  FileClock,
  // BarChart3,   // Analytics — temporarily disabled, kept for future re-enable
  // Activity,    // System Health — temporarily disabled, kept for future re-enable
  Settings,
  ExternalLink,
  Building2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import seLogo from "@/assets/se-logo.png.asset.json";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Invoice Queue", url: "/queue", icon: Inbox },
  { title: "AI Extraction", url: "/extraction", icon: Sparkles },
  { title: "Validation Center", url: "/validation", icon: ShieldCheck },
  { title: "Human Review", url: "/review", icon: UserCheck },
  { title: "Auto Submission", url: "/submissions", icon: Send },
  { title: "Audit Trail", url: "/audit", icon: FileClock },
  // { title: "Analytics", url: "/analytics", icon: BarChart3 },        // Disabled per product requirements
  // { title: "System Health", url: "/health", icon: Activity },        // Disabled per product requirements
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <img
            src={seLogo.url}
            alt="Schneider Electric"
            width={32}
            height={32}
            className="h-8 w-8 rounded-md shadow-sm"
          />
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-semibold">InvoiceAI-mySchneider</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Schneider Electric · AP Automation
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = item.url === "/" ? path === "/" : path.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Reference</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Procurement Portal">
                  <a
                    href="/portal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Building2 className="h-4 w-4 shrink-0" />
                    {!collapsed && (
                      <span className="flex flex-1 items-center justify-between">
                        InvoicePortal-mySchneider
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </span>
                    )}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
