import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  const { data: userPreferences, isLoading: prefsLoading } = useUserPreferences(userId);

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

      // Check schools by interestId too
      const school = userPreferences.schools.find(s => s.interestId === interestId);
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

      // Check countries by interestId too
      const country = userPreferences.countries.find(c => c.interestId === interestId);
      if (country) {
        return {
          logoUrl: country.league_logo_url || undefined,
          label: country.league_name || country.name,
          rightIcon: country.logo_url,
        };
      }
    }

    // Check entity type+id based focus (no interestId needed)
    if (entityType === 'sport' && entityId) {
      const sport = userPreferences.sports.find(s => s.id === entityId);
      if (sport) {
        return {
          logoUrl: sport.logo_url,
          label: sport.display_label || toTitleCase(sport.sport),
        };
      }
    }

    if (entityType === 'league' && entityId) {
      const league = userPreferences.leagues.find(l => l.id === entityId);
      if (league) {
        return {
          logoUrl: league.logo_url,
          label: league.display_label || league.name || league.code,
        };
      }
    }

    if (entityType === 'team' && entityId) {
      const team = userPreferences.teams.find(t => t.id === entityId);
      if (team) {
        return {
          logoUrl: team.logo_url,
          label: team.display_name,
        };
      }
    }

    if (entityType === 'person' && entityId) {
      const person = userPreferences.people.find(p => p.id === entityId);
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

  // Fallback: fetch entity info directly from DB when not found in preferences
  const needsFallback = isFocused && !headerContent && !prefsLoading;
  const { data: fallbackContent } = useQuery({
    queryKey: ['focusedEntityFallback', focusParam, entityType, entityId, focusLeagueId],
    queryFn: async (): Promise<HeaderContent | null> => {
      // For interestId-based focus, look up the subscriber_interest first
      if (focusParam) {
        const id = parseInt(focusParam);
        const { data: interest } = await supabase
          .from('subscriber_interests')
          .select('sport_id, league_id, team_id, person_id, school_id, country_id')
          .eq('id', id)
          .single();
        if (!interest) return null;

        if (interest.sport_id) {
          const { data } = await supabase.from('sports').select('sport, display_label, logo_url').eq('id', interest.sport_id).single();
          if (data) return { label: data.display_label || toTitleCase(data.sport), logoUrl: data.logo_url };
        }
        if (interest.league_id && !interest.team_id && !interest.school_id && !interest.country_id) {
          const { data } = await supabase.from('leagues').select('code, name, display_label, logo_url').eq('id', interest.league_id).single();
          if (data) return { label: data.display_label || data.name || data.code, logoUrl: data.logo_url };
        }
        if (interest.team_id) {
          const { data } = await supabase.from('teams').select('display_name, logo_url').eq('id', interest.team_id).single();
          if (data) return { label: data.display_name, logoUrl: data.logo_url };
        }
        if (interest.person_id) {
          const { data } = await supabase.from('people').select('name').eq('id', interest.person_id).single();
          if (data) return { label: data.name, logoUrl: null };
        }
        if (interest.school_id) {
          const { data } = await supabase.from('schools').select('short_name, logo_url').eq('id', interest.school_id).single();
          if (data) return { label: data.short_name, logoUrl: data.logo_url };
        }
        if (interest.country_id) {
          const { data } = await supabase.from('countries').select('name, logo_url').eq('id', interest.country_id).single();
          if (data) return { label: data.name, logoUrl: data.logo_url };
        }
        return null;
      }

      // For type+id based focus, query the entity directly
      if (entityType === 'sport' && entityId) {
        const { data } = await supabase.from('sports').select('sport, display_label, logo_url').eq('id', entityId).single();
        if (data) return { label: data.display_label || toTitleCase(data.sport), logoUrl: data.logo_url };
      }
      if (entityType === 'league' && entityId) {
        const { data } = await supabase.from('leagues').select('code, name, display_label, logo_url').eq('id', entityId).single();
        if (data) return { label: data.display_label || data.name || data.code, logoUrl: data.logo_url };
      }
      if (entityType === 'team' && entityId) {
        const { data } = await supabase.from('teams').select('display_name, logo_url').eq('id', entityId).single();
        if (data) return { label: data.display_name, logoUrl: data.logo_url };
      }
      if (entityType === 'person' && entityId) {
        const { data } = await supabase.from('people').select('name').eq('id', entityId).single();
        if (data) return { label: data.name, logoUrl: null };
      }
      if (entityType === 'school' && entityId) {
        const { data } = await supabase.from('schools').select('short_name, logo_url').eq('id', entityId).single();
        if (data) return { label: data.short_name, logoUrl: data.logo_url };
      }
      if (entityType === 'country' && entityId) {
        const { data } = await supabase.from('countries').select('name, logo_url').eq('id', entityId).single();
        if (data) return { label: data.name, logoUrl: data.logo_url };
      }
      return null;
    },
    enabled: !!needsFallback,
    staleTime: 5 * 60 * 1000,
  });

  const displayContent = headerContent || fallbackContent;

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

  // Focused Feed with matching entity display
  if (displayContent) {
    return (
      <div className="flex items-center justify-center gap-2">
        <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
          {displayContent.logoUrl ? (
            <img 
              src={displayContent.logoUrl} 
              alt="" 
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-muted" />
          )}
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-lg md:text-xl font-bold text-foreground truncate">
            {displayContent.label}
          </span>
          {displayContent.rightIcon && (
            <img src={displayContent.rightIcon} alt="" className="w-6 h-5 object-contain flex-shrink-0" />
          )}
          {displayContent.rightLabel && (
            <span className="text-lg md:text-xl font-bold text-foreground flex-shrink-0">
              {displayContent.rightLabel}
            </span>
          )}
          {displayContent.sublabel && (
            <span className="text-lg md:text-xl font-bold text-foreground truncate">
              {displayContent.sublabel}
            </span>
          )}
          <span className="text-lg md:text-xl font-bold text-foreground flex-shrink-0">
            Feed
          </span>
        </div>
      </div>
    );
  }

  // Loading state while fetching entity info
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="text-lg md:text-xl font-bold text-foreground truncate">
        Loading...
      </span>
    </div>
  );
}
