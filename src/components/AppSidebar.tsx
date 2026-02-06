import { useLocation, useNavigate } from "react-router-dom";
import { Home, Newspaper, Settings, User, HelpCircle } from "lucide-react";
import blimpLogo from "@/assets/sportsdig-blimp-logo.png";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Feed", url: "/feed", icon: Newspaper },
  { title: "Topic Manager", url: "/preferences", icon: Settings },
  { title: "Profile", url: "/profile", icon: User },
  { title: "Why SportsDig", url: "/why-sportsdig", icon: HelpCircle },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-4 pb-2">
        <div className="flex items-center gap-2">
          <img src={blimpLogo} alt="SportsDig" className="h-8 object-contain" />
          <span className="font-bold text-lg text-sidebar-foreground">SportsDig</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    isActive={isActive(item.url)}
                    className="cursor-pointer text-black"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
