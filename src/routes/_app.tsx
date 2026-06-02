import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { AppProvider } from "@/store/appStore";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <AppProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex min-h-screen w-full flex-col bg-background">
          <TopBar />
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
          <Toaster theme="dark" position="bottom-right" />
        </SidebarInset>
      </SidebarProvider>
    </AppProvider>
  );
}
