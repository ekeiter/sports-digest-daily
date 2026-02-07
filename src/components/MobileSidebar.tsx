import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close sidebar when route changes
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="p-2 hover:bg-muted rounded-md transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="p-0 w-[280px] bg-[#D5D5D5]"
      >
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SidebarProvider defaultOpen={true}>
          <div className="h-full w-full">
            <AppSidebar isMobileOverlay />
          </div>
        </SidebarProvider>
      </SheetContent>
    </Sheet>
  );
}
