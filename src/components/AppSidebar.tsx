import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Home, Newspaper, Settings, User, HelpCircle } from "lucide-react";
import blimpLogo from "@/assets/sportsdig-blimp-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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

// Helper to properly capitalize sport names
const toTitleCase = (str: string) => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface FavoriteCardProps {
  logoUrl?: string | null;
  label: string;
  sublabel?: string;
  onClick: () => void;
}

function FavoriteCard({ logoUrl, label, sublabel, onClick }: FavoriteCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full p-2 rounded-md bg-card border border-border hover:bg-accent transition-colors text-left"
    >
      <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center">
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt="" 
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-muted" />
        )}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold text-foreground truncate">{label}</span>
        {sublabel && (
          <span className="text-[10px] text-muted-foreground truncate">{sublabel}</span>
        )}
      </div>
    </button>
  );
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const { data: userPreferences } = useUserPreferences(userId);

  const isActive = (path: string) => currentPath === path;

  const getPersonLogo = (person: any) => {
    if (person.teams?.logo_url) return person.teams.logo_url;
    if (person.schools?.logo_url) return person.schools.logo_url;
    if (person.leagues?.logo_url) return person.leagues.logo_url;
    if (person.sports?.logo_url) return person.sports.logo_url;
    return null;
  };

  const hasFavorites = userPreferences && (
    userPreferences.sports.length > 0 ||
    userPreferences.leagues.length > 0 ||
    userPreferences.teams.length > 0 ||
    userPreferences.schools.length > 0 ||
    userPreferences.countries.length > 0 ||
    userPreferences.people.length > 0 ||
    userPreferences.olympicsPrefs.length > 0
  );

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

        {/* Favorites Section */}
        {hasFavorites && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-sm font-bold text-black px-4">
              Favorites
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <ScrollArea className="h-[calc(100vh-320px)]">
                <div className="flex flex-col gap-1 px-2">
                  {/* Sports */}
                  {userPreferences.sports.map(sport => (
                    <FavoriteCard
                      key={`sport-${sport.id}`}
                      logoUrl={sport.logo_url}
                      label={sport.display_label || toTitleCase(sport.sport)}
                      onClick={() => navigate(`/feed?focus=${sport.interestId}`)}
                    />
                  ))}
                  
                  {/* Leagues */}
                  {userPreferences.leagues.map(league => (
                    <FavoriteCard
                      key={`league-${league.id}`}
                      logoUrl={league.logo_url}
                      label={league.code || league.name}
                      onClick={() => navigate(`/feed?focus=${league.interestId}`)}
                    />
                  ))}
                  
                  {/* Teams */}
                  {userPreferences.teams.map(team => (
                    <FavoriteCard
                      key={`team-${team.id}`}
                      logoUrl={team.logo_url}
                      label={team.display_name}
                      onClick={() => navigate(`/feed?focus=${team.interestId}`)}
                    />
                  ))}
                  
                  {/* Schools */}
                  {userPreferences.schools.map(school => (
                    <FavoriteCard
                      key={`school-${school.id}-${school.league_id || 'all'}`}
                      logoUrl={school.logo_url}
                      label={school.short_name}
                      sublabel={school.league_code || "All Sports"}
                      onClick={() => {
                        let url = `/feed?type=school&id=${school.id}`;
                        if (school.league_id) url += `&leagueId=${school.league_id}`;
                        navigate(url);
                      }}
                    />
                  ))}
                  
                  {/* Countries */}
                  {userPreferences.countries.map(country => (
                    <FavoriteCard
                      key={`country-${country.id}-${country.league_id || 'all'}`}
                      logoUrl={country.logo_url}
                      label={country.name}
                      sublabel={country.league_code || undefined}
                      onClick={() => {
                        let url = `/feed?type=country&id=${country.id}`;
                        if (country.league_id) url += `&leagueId=${country.league_id}`;
                        navigate(url);
                      }}
                    />
                  ))}
                  
                  {/* Olympics */}
                  {userPreferences.olympicsPrefs.map(pref => (
                    <FavoriteCard
                      key={`olympics-${pref.id}`}
                      logoUrl="https://upload.wikimedia.org/wikipedia/commons/5/5c/Olympic_rings_without_rims.svg"
                      label={pref.sport_name ? toTitleCase(pref.sport_name) : "Olympics"}
                      sublabel={pref.country_name || "All"}
                      onClick={() => navigate(`/feed?focus=${pref.id}`)}
                    />
                  ))}
                  
                  {/* People */}
                  {userPreferences.people.map(person => (
                    <FavoriteCard
                      key={`person-${person.id}`}
                      logoUrl={getPersonLogo(person)}
                      label={person.name}
                      onClick={() => navigate(`/feed?focus=${person.interestId}`)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
