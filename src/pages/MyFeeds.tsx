import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useUserPreferences, useInvalidateUserPreferences } from "@/hooks/useUserPreferences";
import { useInvalidateArticleFeed } from "@/hooks/useArticleFeed";
import { MobileSidebar } from "@/components/MobileSidebar";
import sportsdigLogo from "@/assets/sportsdig-blimp-logo.png";
import { Loader2 } from "lucide-react";

// Helper to properly capitalize sport names
const toTitleCase = (str: string) =>
  str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

// Helper to get M/W indicator for gendered college leagues
const getGenderIndicator = (leagueCode: string | null): string | null => {
  if (!leagueCode) return null;
  const male = ['NCAAB', 'NCAAM', 'NCAAMH', 'NCAAMSOC'];
  const female = ['NCAAW', 'NCAAWH', 'NCAAWSOC', 'NCAASB'];
  if (male.includes(leagueCode)) return 'M';
  if (female.includes(leagueCode)) return 'W';
  return null;
};

interface FavoriteRowProps {
  logoUrl?: string | null;
  label: string;
  sublabel?: string;
  rightIcon?: string | null;
  rightLabel?: string | null;
  onClick: () => void;
  onDelete: () => void;
}

function FavoriteRow({ logoUrl, label, sublabel, rightIcon, rightLabel, onClick, onDelete }: FavoriteRowProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left shadow-sm"
    >
      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center dark:bg-white dark:rounded dark:p-0.5">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="max-w-full max-h-full object-contain" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-muted" />
        )}
      </div>
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <span className="text-sm font-semibold text-foreground truncate">{label}</span>
        {rightIcon && <img src={rightIcon} alt="" className="w-6 h-5 object-contain flex-shrink-0" />}
        {rightLabel && <span className="text-sm font-semibold text-foreground flex-shrink-0">{rightLabel}</span>}
        {sublabel && <span className="text-sm font-semibold text-muted-foreground truncate">{sublabel}</span>}
      </div>
      <div onClick={handleDelete} className="flex-shrink-0 p-1 hover:scale-110 transition-transform cursor-pointer">
        <Trash2 className="h-4 w-4 text-destructive" />
      </div>
    </button>
  );
}

export default function MyFeeds() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const invalidatePreferences = useInvalidateUserPreferences();
  const invalidateFeed = useInvalidateArticleFeed();

  const { data: prefs, isLoading } = useUserPreferences(userId);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      setUserId(user.id);
    };
    getUser();
  }, []);

  const handleDelete = async (interestId: number) => {
    const { error } = await supabase
      .from("subscriber_interests")
      .delete()
      .eq("id", interestId);
    if (error) { toast.error("Failed to remove favorite"); return; }
    toast.success("Favorite removed");
    if (userId) { invalidatePreferences(userId); invalidateFeed(userId); }
  };

  const getPersonLogo = (person: any) => {
    if (person.teams?.logo_url) return person.teams.logo_url;
    if (person.schools?.logo_url) return person.schools.logo_url;
    if (person.leagues?.logo_url) return person.leagues.logo_url;
    if (person.sports?.logo_url) return person.sports.logo_url;
    return null;
  };

  const hasFavorites = prefs && (
    prefs.sports.length > 0 || prefs.leagues.length > 0 || prefs.teams.length > 0 ||
    prefs.schools.length > 0 || prefs.countries.length > 0 || prefs.people.length > 0 ||
    prefs.olympicsPrefs.length > 0
  );

  return (
    <div className="h-full flex flex-col overflow-hidden bg-page-bg">
      {/* Header */}
      <header className="bg-page-bg flex-shrink-0 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center md:hidden">
            <div className="w-10 flex justify-start"><MobileSidebar /></div>
            <div className="flex-1 flex items-center justify-center gap-2">
              <span className="text-lg font-bold text-foreground">Favorites</span>
            </div>
            <div className="w-10" />
          </div>
          <div className="hidden md:flex items-center justify-center gap-3 py-1">
            <img src={sportsdigLogo} alt="SportsDig" className="h-10 object-contain" />
            <span className="text-lg font-bold text-foreground">Favorites</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-3 py-3 max-w-lg">
          {isLoading || !userId ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !hasFavorites ? (
            <div className="text-center py-16 space-y-3">
              <p className="text-muted-foreground">No favorites yet</p>
              <button
                onClick={() => navigate("/preferences")}
                className="text-sm font-medium text-primary underline"
              >
                Go to Feed Manager to add some
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {/* Sports */}
              {prefs.sports.map(sport => (
                <FavoriteRow
                  key={`sport-${sport.id}`}
                  logoUrl={sport.logo_url}
                  label={sport.display_label || toTitleCase(sport.sport)}
                  onClick={() => navigate(`/feed?focus=${sport.interestId}`)}
                  onDelete={() => handleDelete(sport.interestId)}
                />
              ))}

              {/* Leagues */}
              {prefs.leagues.map(league => (
                <FavoriteRow
                  key={`league-${league.id}`}
                  logoUrl={league.logo_url}
                  label={league.display_label || league.name || league.code}
                  onClick={() => navigate(`/feed?focus=${league.interestId}`)}
                  onDelete={() => handleDelete(league.interestId)}
                />
              ))}

              {/* Teams */}
              {prefs.teams.map(team => (
                <FavoriteRow
                  key={`team-${team.id}`}
                  logoUrl={team.logo_url}
                  label={team.display_name}
                  onClick={() => navigate(`/feed?focus=${team.interestId}`)}
                  onDelete={() => handleDelete(team.interestId)}
                />
              ))}

              {/* Schools */}
              {prefs.schools.map(school => {
                const genderIndicator = getGenderIndicator(school.league_code);
                return (
                  <FavoriteRow
                    key={`school-${school.id}-${school.league_id || 'all'}`}
                    logoUrl={school.logo_url}
                    label={school.short_name}
                    rightIcon={school.league_logo_url}
                    rightLabel={genderIndicator}
                    sublabel={!school.league_id ? "All Sports" : undefined}
                    onClick={() => {
                      let url = `/feed?type=school&id=${school.id}`;
                      if (school.league_id) url += `&leagueId=${school.league_id}`;
                      navigate(url);
                    }}
                    onDelete={() => handleDelete(school.interestId)}
                  />
                );
              })}

              {/* Countries */}
              {prefs.countries.map(country => (
                <FavoriteRow
                  key={`country-${country.id}-${country.league_id || 'all'}`}
                  logoUrl={country.league_logo_url || undefined}
                  label={country.league_name || country.name}
                  rightIcon={country.logo_url}
                  onClick={() => {
                    let url = `/feed?type=country&id=${country.id}`;
                    if (country.league_id) url += `&leagueId=${country.league_id}`;
                    navigate(url);
                  }}
                  onDelete={() => handleDelete(country.interestId)}
                />
              ))}

              {/* Olympics */}
              {prefs.olympicsPrefs.map(pref => {
                const sportLabel = pref.sport_name ? toTitleCase(pref.sport_name) : "All Sports";
                const countryLabel = pref.country_logo ? "" : (pref.country_name || "All Countries");
                return (
                  <FavoriteRow
                    key={`olympics-${pref.id}`}
                    logoUrl="https://upload.wikimedia.org/wikipedia/commons/5/5c/Olympic_rings_without_rims.svg"
                    label={`${sportLabel} -${countryLabel ? ` ${countryLabel}` : ""}`}
                    rightIcon={pref.country_logo}
                    onClick={() => navigate(`/feed?focus=${pref.id}`)}
                    onDelete={() => handleDelete(pref.id)}
                  />
                );
              })}

              {/* People */}
              {prefs.people.map(person => (
                <FavoriteRow
                  key={`person-${person.id}`}
                  logoUrl={getPersonLogo(person)}
                  label={person.name}
                  onClick={() => navigate(`/feed?focus=${person.interestId}`)}
                  onDelete={() => handleDelete(person.interestId)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
