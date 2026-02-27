import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LeagueCard {
  id: number;
  code: string;
  label: string;
  logoUrl: string | null;
}

function LeagueCardMenu() {
  const [leagues, setLeagues] = useState<LeagueCard[]>([]);

  useEffect(() => {
    async function fetchLeagues() {
      // Get leagues ordered by app_order_id with logo from preference_menu_items fallback
      const { data: leagueData } = await supabase
        .from("leagues")
        .select("id, code, name, display_label, logo_url, app_order_id")
        .not("app_order_id", "is", null)
        .order("app_order_id", { ascending: true });

      if (!leagueData) return;

      // Get logos from preference_menu_items as fallback
      const { data: menuItems } = await supabase
        .from("preference_menu_items")
        .select("entity_id, logo_url, label")
        .eq("entity_type", "league")
        .in("entity_id", leagueData.map((l) => l.id));

      const menuMap = new Map(
        (menuItems || []).map((m: any) => [m.entity_id, m])
      );

      setLeagues(
        leagueData.map((l: any) => {
          const menu = menuMap.get(l.id) as any;
          return {
            id: l.id,
            code: l.code,
            label: l.display_label || menu?.label || l.name,
            logoUrl: l.logo_url || menu?.logo_url || null,
          };
        })
      );
    }
    fetchLeagues();
  }, []);

  return (
    <div className="flex flex-col gap-2 p-2 overflow-y-auto h-full w-24 flex-shrink-0 border-r bg-muted/30">
      {leagues.map((league) => (
        <button
          key={league.id}
          className="flex flex-col items-center justify-center gap-1 rounded-lg border bg-card p-2 aspect-square hover:bg-accent/50 transition-colors shadow-sm"
        >
          {league.logoUrl ? (
            <img
              src={league.logoUrl}
              alt={league.label}
              className="w-10 h-10 object-contain"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
              {league.code.slice(0, 3)}
            </div>
          )}
          <span className="text-[9px] leading-tight text-center font-medium text-foreground line-clamp-2">
            {league.label}
          </span>
        </button>
      ))}
    </div>
  );
}

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen w-full flex">
      <LeagueCardMenu />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
