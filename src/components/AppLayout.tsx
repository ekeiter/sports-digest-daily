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
        
        <SidebarInset className="flex-1">
          <div className="max-w-3xl mx-auto w-full">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
