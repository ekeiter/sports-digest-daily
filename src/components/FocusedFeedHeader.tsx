import { useUserPreferences } from "@/hooks/useUserPreferences";
import { Newspaper } from "lucide-react";

// Helper to properly capitalize sport names
const toTitleCase = (str: string) => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper to get M/W indicator for gendered college leagues
const getGenderIndicator = (leagueCode: string | null): string | null => {
  if (!leagueCode) return null;
  const maleLeagues = ['NCAAB', 'NCAAM', 'NCAAMH', 'NCAAMSOC'];
  const femaleLeagues = ['NCAAW', 'NCAAWH', 'NCAAWSOC', 'NCAASB'];
  if (maleLeagues.includes(leagueCode)) return 'M';
  if (femaleLeagues.includes(leagueCode)) return 'W';
  return null;
};

interface FocusedFeedHeaderProps {
  userId: string | null;
  focusParam?: string | null;
  entityType?: string | null;
  entityId?: number;
  focusLeagueId?: number;
}

interface HeaderContent {
  logoUrl?: string | null;
  label: string;
  rightIcon?: string | null;
  rightLabel?: string | null;
  sublabel?: string;
}

export function FocusedFeedHeader({ 
  userId, 
  focusParam, 
  entityType, 
  entityId, 
  focusLeagueId 
}: FocusedFeedHeaderProps) {
  const { data: userPreferences } = useUserPreferences(userId);

  const getPersonLogo = (person: any) => {
    if (person.teams?.logo_url) return person.teams.logo_url;
    if (person.schools?.logo_url) return person.schools.logo_url;
    if (person.leagues?.logo_url) return person.leagues.logo_url;
    if (person.sports?.logo_url) return person.sports.logo_url;
    return null;
  };

  // Find the matching favorite and get its display data
  const getHeaderContent = (): HeaderContent | null => {
    if (!userPreferences) return null;
    
    const interestId = focusParam ? parseInt(focusParam) : undefined;

    // Check sports
    if (interestId) {
      const sport = userPreferences.sports.find(s => s.interestId === interestId);
      if (sport) {
        return {
          logoUrl: sport.logo_url,
          label: sport.display_label || toTitleCase(sport.sport),
        };
      }

      // Check leagues
      const league = userPreferences.leagues.find(l => l.interestId === interestId);
      if (league) {
        return {
          logoUrl: league.logo_url,
          label: league.display_label || league.name || league.code,
        };
      }

      // Check teams
      const team = userPreferences.teams.find(t => t.interestId === interestId);
      if (team) {
        return {
          logoUrl: team.logo_url,
          label: team.display_name,
        };
      }

      // Check olympics
      const olympics = userPreferences.olympicsPrefs.find(o => o.id === interestId);
      if (olympics) {
        const sportLabel = olympics.sport_name ? toTitleCase(olympics.sport_name) : "All Sports";
        const countryLabel = olympics.country_logo ? "" : (olympics.country_name || "All Countries");
        const displayLabel = `${sportLabel} -${countryLabel ? ` ${countryLabel}` : ""}`;
        return {
          logoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Olympic_rings_without_rims.svg",
          label: displayLabel,
          rightIcon: olympics.country_logo,
        };
      }

      // Check people
      const person = userPreferences.people.find(p => p.interestId === interestId);
      if (person) {
        return {
          logoUrl: getPersonLogo(person),
          label: person.name,
        };
      }
    }

    // Check schools (type+id based)
    if (entityType === 'school' && entityId) {
      const school = userPreferences.schools.find(s => 
        s.id === entityId && 
        (focusLeagueId ? s.league_id === focusLeagueId : !s.league_id)
      );
      if (school) {
        const genderIndicator = getGenderIndicator(school.league_code || null);
        return {
          logoUrl: school.logo_url,
          label: school.short_name,
          rightIcon: school.league_logo_url,
          rightLabel: genderIndicator,
          sublabel: !school.league_id ? "All Sports" : undefined,
        };
      }
    }

    // Check countries (type+id based)
    if (entityType === 'country' && entityId) {
      const country = userPreferences.countries.find(c => 
        c.id === entityId && 
        (focusLeagueId ? c.league_id === focusLeagueId : !c.league_id)
      );
      if (country) {
        return {
          logoUrl: country.league_logo_url || undefined,
          label: country.league_name || country.name,
          rightIcon: country.logo_url,
        };
      }
    }

    return null;
  };

  const headerContent = getHeaderContent();
  const isFocused = focusParam || (entityType && entityId);

  // Combined Feed header (no focus)
  if (!isFocused) {
    return (
      <div className="flex items-center justify-center gap-2">
        <Newspaper className="h-5 w-5 text-primary flex-shrink-0" />
        <span className="text-lg md:text-xl font-bold text-foreground truncate">
          Combined Favorites Feed
        </span>
      </div>
    );
  }

  // Focused Feed with matching favorite display
  if (headerContent) {
    return (
      <div className="flex items-center justify-center gap-2">
        <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
          {headerContent.logoUrl ? (
            <img 
              src={headerContent.logoUrl} 
              alt="" 
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-muted" />
          )}
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-lg md:text-xl font-bold text-foreground truncate">
            {headerContent.label}
          </span>
          {headerContent.rightIcon && (
            <img src={headerContent.rightIcon} alt="" className="w-6 h-5 object-contain flex-shrink-0" />
          )}
          {headerContent.rightLabel && (
            <span className="text-lg md:text-xl font-bold text-foreground flex-shrink-0">
              {headerContent.rightLabel}
            </span>
          )}
          {headerContent.sublabel && (
            <span className="text-lg md:text-xl font-bold text-foreground truncate">
              {headerContent.sublabel}
            </span>
          )}
          <span className="text-lg md:text-xl font-bold text-foreground flex-shrink-0">
            Feed
          </span>
        </div>
      </div>
    );
  }

  // Fallback for focused feed without matching favorite (still loading or not found)
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="text-lg md:text-xl font-bold text-foreground truncate">
        Focused Feed
      </span>
    </div>
  );
}
