import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      {/* Outer wrapper: centers the inner block on lg+ */}
      <div className="min-h-screen w-full flex lg:justify-center lg:[--sidebar-left:calc((100vw-63rem)/2)]">
        {/* Inner block: sidebar + feed with fixed combined width on lg+ */}
        <div className="flex w-full lg:max-w-[63rem]">
          {/* Sidebar only visible on md+ screens */}
          <div className="hidden md:block flex-shrink-0">
            <AppSidebar />
          </div>
          
          <SidebarInset className="flex-1 overflow-hidden">
            <div className="w-full h-full overflow-auto">
              {children}
            </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
