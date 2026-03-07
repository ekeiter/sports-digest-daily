import { Newspaper, Settings, Heart, UserCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const navItems = [
  { label: "News", icon: Newspaper, path: "/feed" },
  { label: "Feed Manager", icon: Settings, path: "/preferences" },
  { label: "Favorites", icon: Heart, path: "/my-feeds" },
  { label: "Profile", icon: UserCircle, path: "/profile" },
];

export function BottomNavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="border-t bg-background flex-shrink-0">
      <div className="flex justify-around items-center h-14 max-w-3xl mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-100 dark:bg-blue-800/40 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
