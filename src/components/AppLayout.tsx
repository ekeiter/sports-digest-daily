import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Sidebar only visible on md+ screens */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        
        <SidebarInset className="flex-1 overflow-hidden">
          <div className="max-w-3xl w-full h-full overflow-auto">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
