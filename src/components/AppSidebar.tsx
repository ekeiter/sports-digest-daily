import { useLocation, useNavigate } from "react-router-dom";
import { Newspaper, Settings, User, HelpCircle, BookOpen, Star } from "lucide-react";
import blimpLogo from "@/assets/sportsdig-blimp-logo.png";
import { cn } from "@/lib/utils";

import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Combined Favorites Feed", url: "/feed", icon: Newspaper },
  { title: "Feed Topic Manager", url: "/preferences", icon: Settings },
  { title: "Favorites", url: "/my-feeds", icon: Star },
  { title: "Instructions", url: "/instructions", icon: BookOpen },
  { title: "Why SportsDig", url: "/why-sportsdig", icon: HelpCircle },
  { title: "Profile", url: "/profile", icon: User },
];

interface AppSidebarProps {
  isMobileOverlay?: boolean;
}

export function AppSidebar({ isMobileOverlay = false }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  const focusParam = searchParams.get('focus');
  const typeParam = searchParams.get('type');

  // Combined feed is only active when on /feed with no focus/type params
  const isCombinedFeedActive = currentPath === '/feed' && !focusParam && !typeParam;
  
  const isActive = (path: string) => {
    if (path === '/feed') return isCombinedFeedActive;
    return currentPath === path;
  };

  return (
    <Sidebar className={cn("border-r-0 flex flex-col h-full", isMobileOverlay && "w-full")} collapsible={isMobileOverlay ? "none" : "offcanvas"}>
      <SidebarHeader className="p-4 pb-2 flex-shrink-0">
        <div className="flex items-center justify-center gap-2">
          <img src={blimpLogo} alt="SportsDig" className="h-10 object-contain" />
          <span className="font-bold text-lg text-sidebar-foreground">SportsDig</span>
        </div>
      </SidebarHeader>

      {/* Menu Section */}
      <div className="flex-shrink-0 px-2">
        <SidebarMenu className="gap-0.5">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                onClick={() => navigate(item.url)}
                isActive={isActive(item.url)}
                className="cursor-pointer text-sidebar-foreground"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </div>
      
      {/* Footer */}
      <div className="mt-auto p-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground text-center space-y-1">
          <p className="font-medium">SportsDig™ — Personalized Sports News</p>
          <p>© 2026 SportsDig. All rights reserved.</p>
          <div className="flex justify-center gap-4 pt-1">
            <span className="underline cursor-pointer hover:text-foreground transition-colors" onClick={() => navigate('/contact')}>Contact</span>
            <span className="underline cursor-pointer hover:text-foreground transition-colors" onClick={() => navigate('/privacy')}>Privacy Policy</span>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
