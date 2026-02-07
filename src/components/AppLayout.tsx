import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      {/* Mobile/Tablet: sidebar flush left, feed fills remaining space */}
      {/* PC (lg+): sidebar + feed centered together as one block */}
      <div className="min-h-screen w-full flex lg:justify-center">
        <div className="flex w-full lg:w-auto">
          {/* Sidebar only visible on md+ screens */}
          <div className="hidden md:block flex-shrink-0">
            <AppSidebar />
          </div>
          
          {/* Feed content - full width on mobile/tablet, fixed width on PC */}
          <SidebarInset className="flex-1 lg:flex-none lg:w-[34rem] overflow-hidden">
            <div className="w-full h-full overflow-auto">
              {children}
            </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
