import { Newspaper, Users, Star, UserCircle } from "lucide-react";

const navItems = [
  { label: "League News", icon: Newspaper },
  { label: "People News", icon: Users },
  { label: "Favorites", icon: Star },
  { label: "Profile", icon: UserCircle },
];

export function BottomNavBar() {
  return (
    <nav className="border-t bg-background flex-shrink-0 md:hidden">
      <div className="flex justify-around items-center h-14">
        {navItems.map((item) => (
          <button
            key={item.label}
            type="button"
            disabled
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 text-muted-foreground opacity-60"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] leading-tight">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
