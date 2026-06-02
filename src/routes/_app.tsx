import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { AppProvider } from "@/store/appStore";
import { AuthProvider, useAuth } from "@/store/authStore";
import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";

export const Route = createFileRoute("/_app")({
  ssr: false, // session is in localStorage; gate runs client-side
  component: () => (
    <AuthProvider>
      <AuthGate>
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
      </AuthGate>
    </AuthProvider>
  ),
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !user) {
      navigate({
        to: "/login",
        search: { redirect: window.location.pathname },
        replace: true,
      });
    }
  }, [ready, user, navigate]);

  if (!ready || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="text-sm text-muted-foreground">Authenticating…</div>
      </div>
    );
  }

  return <>{children}</>;
}
