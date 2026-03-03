import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Loader2, Newspaper } from "lucide-react";
import { toast } from "sonner";
import { useUserPreferences, useInvalidateUserPreferences } from "@/hooks/useUserPreferences";
import { useInvalidateArticleFeed } from "@/hooks/useArticleFeed";
import sportsdigLogo from "@/assets/sportsdig-blimp-logo.png";

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

interface FavoriteCardProps {
  logoUrl?: string | null;
  label: string;
  sublabel?: string;
  secondaryIcon?: string | null;
  secondaryLabel?: string | null;
  onClick: () => void;
  onDelete: () => void;
}

function FavoriteCard({ logoUrl, label, sublabel, secondaryIcon, secondaryLabel, onClick, onDelete }: FavoriteCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center gap-1.5 w-full p-3 pt-4 rounded-xl bg-white dark:bg-card hover:bg-accent/50 transition-colors text-center shadow-[0_2px_8px_rgba(0,0,0,0.12)] select-none h-[116px]"
    >
      {/* Delete icon - upper right */}
      <div
        onClick={handleDelete}
        className="absolute top-1.5 right-1.5 p-1 hover:scale-110 transition-transform cursor-pointer"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </div>

      {/* Logo */}
      <div className="w-8 h-8 flex items-center justify-center dark:bg-white dark:rounded dark:p-0.5 flex-shrink-0">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="max-w-full max-h-full object-contain" onError={e => e.currentTarget.style.display = 'none'} />
        ) : (
          <div className="w-6 h-6 rounded-full bg-muted" />
        )}
      </div>

      {/* Label */}
      <span className="text-xs md:text-sm font-medium line-clamp-2 w-full">{label}</span>

      {/* Secondary icon row (league logo / country flag) */}
      {(secondaryIcon || secondaryLabel) && (
        <div className="flex items-center justify-center gap-1">
          {secondaryLabel && <span className="text-xs font-medium text-foreground">{secondaryLabel}</span>}
          {secondaryIcon && <img src={secondaryIcon} alt="" className="w-5 h-4 object-contain" />}
        </div>
      )}

      {sublabel && (
        <span className="text-[10px] leading-tight text-muted-foreground line-clamp-2 w-full">{sublabel}</span>
      )}
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
    <div className="h-full flex flex-col overflow-hidden bg-[hsl(210_14%_89%)]">
      {/* Header */}
      <header className="bg-page-bg flex-shrink-0 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center">
            <img src={sportsdigLogo} alt="SportsDig" className="h-7 w-7 object-contain flex-shrink-0" />
            <div className="flex-1 flex items-center justify-center">
              <span className="text-lg font-bold text-foreground">Favorites</span>
            </div>
            <div className="w-7 flex-shrink-0" />
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
            <div className="space-y-3">
              {/* Combined Favorites Feed button */}
              <button
                onClick={() => navigate("/feed")}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white dark:bg-card text-foreground font-semibold text-sm shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:bg-accent/50 transition-colors"
              >
                <Newspaper className="h-5 w-5" />
                Combined Favorites Feed
              </button>

            <div className="grid grid-cols-3 gap-2">
              {/* Sports */}
              {prefs.sports.map(sport => (
                <FavoriteCard
                  key={`sport-${sport.id}`}
                  logoUrl={sport.logo_url}
                  label={sport.display_label || toTitleCase(sport.sport)}
                  onClick={() => navigate(`/feed?focus=${sport.interestId}`)}
                  onDelete={() => handleDelete(sport.interestId)}
                />
              ))}

              {/* Leagues */}
              {prefs.leagues.map(league => (
                <FavoriteCard
                  key={`league-${league.id}`}
                  logoUrl={league.logo_url}
                  label={league.display_label || league.name || league.code}
                  onClick={() => navigate(`/feed?focus=${league.interestId}`)}
                  onDelete={() => handleDelete(league.interestId)}
                />
              ))}

              {/* Teams */}
              {prefs.teams.map(team => (
                <FavoriteCard
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
                  <FavoriteCard
                    key={`school-${school.id}-${school.league_id || 'all'}`}
                    logoUrl={school.logo_url}
                    label={school.short_name}
                    secondaryIcon={school.league_logo_url}
                    secondaryLabel={genderIndicator}
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
                <FavoriteCard
                  key={`country-${country.id}-${country.league_id || 'all'}`}
                  logoUrl={country.league_logo_url || undefined}
                  label={country.league_name || country.name}
                  secondaryIcon={country.logo_url}
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
                  <FavoriteCard
                    key={`olympics-${pref.id}`}
                    logoUrl="https://upload.wikimedia.org/wikipedia/commons/5/5c/Olympic_rings_without_rims.svg"
                    label={`${sportLabel}`}
                    sublabel={countryLabel || undefined}
                    secondaryIcon={pref.country_logo}
                    onClick={() => navigate(`/feed?focus=${pref.id}`)}
                    onDelete={() => handleDelete(pref.id)}
                  />
                );
              })}

              {/* People */}
              {prefs.people.map(person => {
                const details: string[] = [];
                if (person.position) details.push(person.position);
                if (person.teams?.display_name) details.push(person.teams.display_name);
                else if (person.schools?.short_name) details.push(person.schools.short_name);
                if (person.leagues?.code) details.push(person.leagues.code);
                return (
                  <FavoriteCard
                    key={`person-${person.id}`}
                    logoUrl={getPersonLogo(person)}
                    label={person.name}
                    sublabel={details.length > 0 ? details.join(' · ') : undefined}
                    onClick={() => navigate(`/feed?focus=${person.interestId}`)}
                    onDelete={() => handleDelete(person.interestId)}
                  />
                );
              })}
            </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
