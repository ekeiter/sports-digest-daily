import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type League = Database['public']['Tables']['leagues']['Row'];
type Team = Database['public']['Tables']['teams']['Row'] & {
  leagues?: {
    code: string;
  } | null;
};
type Sport = Database['public']['Tables']['sports']['Row'];
type School = Database['public']['Tables']['schools']['Row'] & {
  league_code?: string | null;
};

export interface Person {
  id: number;
  name: string;
  role: string;
  position?: string;
  teams?: {
    display_name: string;
    nickname: string;
    logo_url: string | null;
  } | null;
  leagues?: {
    code: string;
    name: string;
    logo_url: string | null;
  } | null;
  sports?: {
    sport: string;
    display_name: string;
    logo_url: string | null;
  } | null;
}

export interface OlympicsPreference {
  id: number;
  sport_id: number | null;
  country_id: number | null;
  sport_name?: string;
  sport_logo?: string | null;
  country_name?: string;
  country_logo?: string | null;
}

export interface UserPreferences {
  sports: Sport[];
  leagues: League[];
  teams: Team[];
  people: Person[];
  schools: School[];
  olympicsPrefs: OlympicsPreference[];
  focusedItems: Set<string>;
}

async function fetchUserPreferences(userId: string): Promise<UserPreferences> {
  // Single query to get all interests with focus status using explicit FK columns
  const { data: allInterests, error: interestsError } = await supabase
    .from("subscriber_interests")
    .select("id, sport_id, league_id, team_id, person_id, school_id, country_id, is_olympics, is_focused")
    .eq("subscriber_id", userId);

  if (interestsError) {
    throw interestsError;
  }

  // Build focused items set and group by type
  const focused = new Set<string>();
  const sportIds: number[] = [];
  const leagueIds: number[] = [];
  const teamIds: number[] = [];
  const personIds: number[] = [];
  const schoolIds: number[] = [];
  const olympicsInterests: { id: number; sport_id: number | null; country_id: number | null }[] = [];

  (allInterests || []).forEach(interest => {
    // Handle Olympics preferences separately
    if (interest.is_olympics) {
      olympicsInterests.push({
        id: interest.id,
        sport_id: interest.sport_id,
        country_id: interest.country_id,
      });
      return;
    }
    
    if (interest.sport_id !== null) {
      sportIds.push(interest.sport_id);
      if (interest.is_focused) focused.add(`sport-${interest.sport_id}`);
    }
    if (interest.league_id !== null) {
      leagueIds.push(interest.league_id);
      if (interest.is_focused) focused.add(`league-${interest.league_id}`);
    }
    if (interest.team_id !== null) {
      teamIds.push(interest.team_id);
      if (interest.is_focused) focused.add(`team-${interest.team_id}`);
    }
    if (interest.person_id !== null) {
      personIds.push(interest.person_id);
      if (interest.is_focused) focused.add(`person-${interest.person_id}`);
    }
    if (interest.school_id !== null) {
      schoolIds.push(interest.school_id);
      if (interest.is_focused) focused.add(`school-${interest.school_id}`);
    }
  });

  // Collect unique sport/country IDs from olympics interests for batch lookup
  const olympicsSportIds = [...new Set(olympicsInterests.map(o => o.sport_id).filter((id): id is number => id !== null))];
  const olympicsCountryIds = [...new Set(olympicsInterests.map(o => o.country_id).filter((id): id is number => id !== null))];

  // Fetch all details in parallel
  // Build a map of school_id to league_id from interests for enrichment
  const schoolLeagueMap = new Map<number, number | null>();
  (allInterests || []).forEach(interest => {
    if (interest.school_id !== null) {
      schoolLeagueMap.set(interest.school_id, interest.league_id);
    }
  });

  const [sportsResult, leaguesResult, teamsResult, peopleResult, schoolsResult, leaguesForSchoolsResult, olympicsSportsResult, olympicsCountriesResult, olympicsSportLogosResult, sportMenuLogosResult, leagueMenuLogosResult] = await Promise.all([
    sportIds.length > 0
      ? supabase.from("sports").select("*").in("id", sportIds)
      : Promise.resolve({ data: [], error: null }),
    leagueIds.length > 0
      ? supabase.from("leagues").select("*").in("id", leagueIds)
      : Promise.resolve({ data: [], error: null }),
    teamIds.length > 0
      ? supabase.from("teams").select("*, leagues(code)").in("id", teamIds)
      : Promise.resolve({ data: [], error: null }),
    personIds.length > 0
      ? supabase.from("people").select(`
          id,
          name,
          role,
          position,
          teams (
            display_name,
            nickname,
            logo_url
          ),
          leagues (
            code,
            name,
            logo_url
          ),
          sports (
            sport,
            display_name,
            logo_url
          )
        `).in("id", personIds)
      : Promise.resolve({ data: [], error: null }),
    schoolIds.length > 0
      ? supabase.from("schools").select("*").in("id", schoolIds)
      : Promise.resolve({ data: [], error: null }),
    // Fetch league codes for schools that have league_id
    (() => {
      const leagueIdsForSchools = [...new Set([...schoolLeagueMap.values()].filter((id): id is number => id !== null))];
      return leagueIdsForSchools.length > 0
        ? supabase.from("leagues").select("id, code").in("id", leagueIdsForSchools)
        : Promise.resolve({ data: [], error: null });
    })(),
    olympicsSportIds.length > 0
      ? supabase.from("sports").select("id, sport").in("id", olympicsSportIds)
      : Promise.resolve({ data: [], error: null }),
    olympicsCountryIds.length > 0
      ? supabase.from("countries").select("id, name, logo_url").in("id", olympicsCountryIds)
      : Promise.resolve({ data: [], error: null }),
    olympicsSportIds.length > 0
      ? supabase.from("olympic_sports").select("sport_id, logo_url").in("sport_id", olympicsSportIds)
      : Promise.resolve({ data: [], error: null }),
    // Fetch label and logo from preference_menu_items for sports
    sportIds.length > 0
      ? supabase.from("preference_menu_items").select("entity_id, label, logo_url").eq("entity_type", "sport").in("entity_id", sportIds)
      : Promise.resolve({ data: [], error: null }),
    // Fetch label and logo from preference_menu_items for leagues
    leagueIds.length > 0
      ? supabase.from("preference_menu_items").select("entity_id, label, logo_url").eq("entity_type", "league").in("entity_id", leagueIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  // Build lookup maps for label and logo from preference_menu_items
  const sportMenuMap = new Map((sportMenuLogosResult.data || []).map(s => [s.entity_id, { label: s.label, logo_url: s.logo_url }]));
  const leagueMenuMap = new Map((leagueMenuLogosResult.data || []).map(l => [l.entity_id, { label: l.label, logo_url: l.logo_url }]));
  
  // Build lookup maps for olympics data
  const sportsMap = new Map((olympicsSportsResult.data || []).map(s => [s.id, s.sport]));
  const countriesMap = new Map((olympicsCountriesResult.data || []).map(c => [c.id, { name: c.name, logo_url: c.logo_url }]));
  const sportLogosMap = new Map((olympicsSportLogosResult.data || []).map(s => [s.sport_id, s.logo_url]));

  // Enrich olympics preferences
  const olympicsPrefs: OlympicsPreference[] = olympicsInterests.map(o => ({
    id: o.id,
    sport_id: o.sport_id,
    country_id: o.country_id,
    sport_name: o.sport_id ? sportsMap.get(o.sport_id) : undefined,
    sport_logo: o.sport_id ? sportLogosMap.get(o.sport_id) : undefined,
    country_name: o.country_id ? countriesMap.get(o.country_id)?.name : undefined,
    country_logo: o.country_id ? countriesMap.get(o.country_id)?.logo_url : undefined,
  }));

  // Sort and enrich sports with label and logo from preference_menu_items
  const sports = (sportsResult.data || []).map(sport => {
    const menuData = sportMenuMap.get(sport.id);
    return {
      ...sport,
      display_label: menuData?.label || sport.display_label || sport.sport,
      logo_url: sport.logo_url || menuData?.logo_url || null,
    };
  }).sort((a, b) => 
    (a.display_label || a.sport).localeCompare(b.display_label || b.sport)
  );
  
  // Sort and enrich leagues with label and logo from preference_menu_items
  const leagues = (leaguesResult.data || []).map(league => {
    const menuData = leagueMenuMap.get(league.id);
    return {
      ...league,
      name: menuData?.label || league.name,
      logo_url: league.logo_url || menuData?.logo_url || null,
    };
  }).sort((a, b) =>
    (a.code || a.name).localeCompare(b.code || b.name)
  );
  const teams = ((teamsResult.data || []) as Team[]).sort((a, b) => 
    a.display_name.localeCompare(b.display_name)
  );
  const people = ((peopleResult.data || []) as Person[]).sort((a, b) => 
    a.name.localeCompare(b.name)
  );
  // Build league code lookup for schools
  const schoolLeagueCodeMap = new Map((leaguesForSchoolsResult.data || []).map(l => [l.id, l.code]));
  
  // Enrich schools with their league_code
  const schools = ((schoolsResult.data || []) as School[]).map(school => {
    const leagueId = schoolLeagueMap.get(school.id);
    return {
      ...school,
      league_code: leagueId ? schoolLeagueCodeMap.get(leagueId) : null,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  return {
    sports,
    leagues,
    teams,
    people,
    schools,
    olympicsPrefs,
    focusedItems: focused,
  };
}

export function useUserPreferences(userId: string | null) {
  return useQuery({
    queryKey: ['userPreferences', userId],
    queryFn: () => fetchUserPreferences(userId!),
    enabled: !!userId,
    // Ensure MyFeeds reflects changes when navigating back without a full refresh
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
}

export function usePrefetchUserPreferences() {
  const queryClient = useQueryClient();

  return async (userId: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['userPreferences', userId],
      queryFn: () => fetchUserPreferences(userId),
      staleTime: 5 * 60 * 1000,
    });
  };
}

export function useInvalidateUserPreferences() {
  const queryClient = useQueryClient();

  return (userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['userPreferences', userId] });
  };
}

// Fire-and-forget prefetch for the article feed
export function prefetchArticleFeed(userId: string) {
  // Don't await - this warms the DB cache in the background
  supabase.rpc('get_subscriber_feed' as any, { 
    p_subscriber_id: userId, 
    p_limit: 50 
  });
}
