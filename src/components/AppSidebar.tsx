import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Newspaper, Settings, User, HelpCircle, Trash2, BookOpen } from "lucide-react";
import blimpLogo from "@/assets/sportsdig-blimp-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useUserPreferences, useInvalidateUserPreferences } from "@/hooks/useUserPreferences";
import { useInvalidateArticleFeed } from "@/hooks/useArticleFeed";

import { toast } from "sonner";

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
  { title: "Instructions", url: "/instructions", icon: BookOpen },
  { title: "Why SportsDig", url: "/why-sportsdig", icon: HelpCircle },
  { title: "Profile", url: "/profile", icon: User },
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
  countryFlag?: string | null;
  isActive?: boolean;
  onClick: () => void;
  onDelete: () => void;
}

function FavoriteCard({ logoUrl, label, sublabel, countryFlag, isActive, onClick, onDelete }: FavoriteCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-md border border-favorite-card-border hover:bg-favorite-card-hover transition-colors text-left ${isActive ? 'bg-white' : 'bg-favorite-card'}`}
    >
      <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt="" 
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="w-4 h-4 rounded-full bg-muted" />
        )}
      </div>
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <span className="text-xs font-semibold text-foreground truncate">{label}</span>
        {countryFlag && (
          <img src={countryFlag} alt="" className="w-4 h-3 object-contain flex-shrink-0" />
        )}
        {sublabel && (
          <span className="text-[10px] text-muted-foreground truncate">{sublabel}</span>
        )}
      </div>
      <div 
        onClick={handleDelete}
        className="flex-shrink-0 p-0.5 hover:scale-110 transition-transform cursor-pointer"
      >
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </div>
    </button>
  );
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  const focusParam = searchParams.get('focus');
  const typeParam = searchParams.get('type');
  const idParam = searchParams.get('id');
  const leagueIdParam = searchParams.get('leagueId');
  
  const [userId, setUserId] = useState<string | null>(null);
  const invalidatePreferences = useInvalidateUserPreferences();
  const invalidateFeed = useInvalidateArticleFeed();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const { data: userPreferences } = useUserPreferences(userId);

  // Combined feed is only active when on /feed with no focus/type params
  const isCombinedFeedActive = currentPath === '/feed' && !focusParam && !typeParam;
  
  const isActive = (path: string) => {
    if (path === '/feed') return isCombinedFeedActive;
    return currentPath === path;
  };

  const getPersonLogo = (person: any) => {
    if (person.teams?.logo_url) return person.teams.logo_url;
    if (person.schools?.logo_url) return person.schools.logo_url;
    if (person.leagues?.logo_url) return person.leagues.logo_url;
    if (person.sports?.logo_url) return person.sports.logo_url;
    return null;
  };

  const handleDeleteInterest = async (interestId: number) => {
    const { error } = await supabase
      .from("subscriber_interests")
      .delete()
      .eq("id", interestId);
    
    if (error) {
      console.error("Error deleting interest:", error);
      toast.error("Failed to remove favorite");
      return;
    }
    
    toast.success("Favorite removed");
    if (userId) {
      invalidatePreferences(userId);
      invalidateFeed(userId);
    }
    
    // If the deleted favorite was the currently focused feed, navigate to combined feed
    if (focusParam === String(interestId)) {
      navigate('/feed');
    }
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
    <Sidebar className="border-r-0 flex flex-col h-full">
      <SidebarHeader className="p-4 pb-2 flex-shrink-0">
        <div className="flex items-center justify-center gap-2">
          <img src={blimpLogo} alt="SportsDig" className="h-10 object-contain" />
          <span className="font-bold text-lg text-sidebar-foreground">SportsDig</span>
        </div>
      </SidebarHeader>

      {/* Fixed Menu Section */}
      <div className="flex-shrink-0 px-2">
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
      </div>

      {/* Scrollable Favorites Section */}
      {hasFavorites && (
        <div className="flex-1 min-h-0 mt-1 flex flex-col">
          <div className="flex-shrink-0 px-4 py-2 text-center">
            <span className="text-base font-bold text-black">Favorites</span>
          </div>
          <div className="flex-1 overflow-y-auto px-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
            <div className="flex flex-col gap-1">
              {/* Sports */}
              {userPreferences.sports.map(sport => (
                <FavoriteCard
                  key={`sport-${sport.id}`}
                  logoUrl={sport.logo_url}
                  label={sport.display_label || toTitleCase(sport.sport)}
                  isActive={focusParam === String(sport.interestId)}
                  onClick={() => navigate(`/feed?focus=${sport.interestId}`)}
                  onDelete={() => handleDeleteInterest(sport.interestId)}
                />
              ))}
              
              {/* Leagues */}
              {userPreferences.leagues.map(league => (
                <FavoriteCard
                  key={`league-${league.id}`}
                  logoUrl={league.logo_url}
                  label={league.display_label || league.name || league.code}
                  isActive={focusParam === String(league.interestId)}
                  onClick={() => navigate(`/feed?focus=${league.interestId}`)}
                  onDelete={() => handleDeleteInterest(league.interestId)}
                />
              ))}
              
              {/* Teams */}
              {userPreferences.teams.map(team => (
                <FavoriteCard
                  key={`team-${team.id}`}
                  logoUrl={team.logo_url}
                  label={team.display_name}
                  isActive={focusParam === String(team.interestId)}
                  onClick={() => navigate(`/feed?focus=${team.interestId}`)}
                  onDelete={() => handleDeleteInterest(team.interestId)}
                />
              ))}
              
              {/* Schools */}
              {userPreferences.schools.map(school => {
                const schoolActive = typeParam === 'school' && idParam === String(school.id) && 
                  (school.league_id ? leagueIdParam === String(school.league_id) : !leagueIdParam);
                return (
                  <FavoriteCard
                    key={`school-${school.id}-${school.league_id || 'all'}`}
                    logoUrl={school.logo_url}
                    label={`${school.short_name} - ${school.league_code || "All Sports"}`}
                    isActive={schoolActive}
                    onClick={() => {
                      let url = `/feed?type=school&id=${school.id}`;
                      if (school.league_id) url += `&leagueId=${school.league_id}`;
                      navigate(url);
                    }}
                    onDelete={() => handleDeleteInterest(school.interestId)}
                  />
                );
              })}
              
              {/* Countries */}
              {userPreferences.countries.map(country => {
                const countryActive = typeParam === 'country' && idParam === String(country.id) &&
                  (country.league_id ? leagueIdParam === String(country.league_id) : !leagueIdParam);
                return (
                  <FavoriteCard
                    key={`country-${country.id}-${country.league_id || 'all'}`}
                    logoUrl={country.league_logo_url || undefined}
                    label={country.league_name || country.name}
                    countryFlag={country.logo_url}
                    isActive={countryActive}
                    onClick={() => {
                      let url = `/feed?type=country&id=${country.id}`;
                      if (country.league_id) url += `&leagueId=${country.league_id}`;
                      navigate(url);
                    }}
                    onDelete={() => handleDeleteInterest(country.interestId)}
                  />
                );
              })}
              
              {/* Olympics */}
              {userPreferences.olympicsPrefs.map(pref => {
                const sportLabel = pref.sport_name ? toTitleCase(pref.sport_name) : "All Sports";
                const countryLabel = pref.country_logo ? "" : (pref.country_name || "All Countries");
                const displayLabel = `${sportLabel} -${countryLabel ? ` ${countryLabel}` : ""}`;
                return (
                  <FavoriteCard
                    key={`olympics-${pref.id}`}
                    logoUrl="https://upload.wikimedia.org/wikipedia/commons/5/5c/Olympic_rings_without_rims.svg"
                    label={displayLabel}
                    countryFlag={pref.country_logo}
                    isActive={focusParam === String(pref.id)}
                    onClick={() => navigate(`/feed?focus=${pref.id}`)}
                    onDelete={() => handleDeleteInterest(pref.id)}
                  />
                );
              })}
              
              {/* People */}
              {userPreferences.people.map(person => (
                <FavoriteCard
                  key={`person-${person.id}`}
                  logoUrl={getPersonLogo(person)}
                  label={person.name}
                  isActive={focusParam === String(person.interestId)}
                  onClick={() => navigate(`/feed?focus=${person.interestId}`)}
                  onDelete={() => handleDeleteInterest(person.interestId)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className="mt-auto p-4 border-t border-sidebar-border">
        <div className="text-xs text-black text-center space-y-1">
          <p className="font-medium">SportsDig™ — Personalized Sports News</p>
          <p>© 2026 SportsDig. All rights reserved.</p>
          <p className="pt-1">
            email:{" "}
            <a href="mailto:info@sportsdig.com" className="hover:text-foreground transition-colors">
              info@sportsdig.com
            </a>
          </p>
        </div>
      </div>
    </Sidebar>
  );
}
