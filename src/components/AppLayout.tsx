import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex justify-center">
        {/* Centered container for sidebar + content */}
        <div className="flex w-full md:w-auto">
          {/* Sidebar only visible on md+ screens */}
          <div className="hidden md:block flex-shrink-0">
            <AppSidebar />
          </div>
          
          <SidebarInset className="flex-1 md:flex-none md:w-[42rem] overflow-hidden">
            <div className="w-full h-full overflow-auto">
              {children}
            </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
