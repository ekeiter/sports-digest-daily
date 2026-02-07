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

// Enriched types that include the subscriber_interests.id for focus navigation
export interface SportWithInterest extends Sport {
  interestId: number;
}

export interface LeagueWithInterest extends League {
  interestId: number;
}

export interface TeamWithInterest extends Team {
  interestId: number;
}

export interface SchoolWithInterest extends School {
  interestId: number;
  league_id?: number | null;
}

export interface CountryWithInterest {
  id: number;
  name: string;
  code: string;
  logo_url: string | null;
  interestId: number;
  league_id?: number | null;
  league_code?: string | null;
  league_name?: string | null;
  league_logo_url?: string | null;
}

export interface Person {
  id: number;
  name: string;
  role: string;
  position?: string;
  country_code?: string | null;
  interestId: number;
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
    display_label: string | null;
    logo_url: string | null;
  } | null;
  schools?: {
    id: number;
    name: string;
    short_name: string;
    logo_url: string | null;
  } | null;
  countries?: {
    id: number;
    name: string;
    code: string;
    logo_url: string | null;
  } | null;
}

export interface OlympicsPreference {
  id: number; // This is already the subscriber_interests.id
  sport_id: number | null;
  country_id: number | null;
  sport_name?: string;
  sport_logo?: string | null;
  country_name?: string;
  country_logo?: string | null;
}

export interface UserPreferences {
  sports: SportWithInterest[];
  leagues: LeagueWithInterest[];
  teams: TeamWithInterest[];
  people: Person[];
  schools: SchoolWithInterest[];
  countries: CountryWithInterest[];
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

  // Build focused items set and group by type with interest ID mapping
  const focused = new Set<string>();
  const sportIds: number[] = [];
  const leagueIds: number[] = [];
  const teamIds: number[] = [];
  const personIds: number[] = [];
  const schoolIds: number[] = [];
  const countryInterests: { id: number; country_id: number; league_id: number | null }[] = [];
  const olympicsInterests: { id: number; sport_id: number | null; country_id: number | null }[] = [];
  
  // Maps from entity ID to subscriber_interests.id for focus navigation
  const sportInterestMap = new Map<number, number>();
  const leagueInterestMap = new Map<number, number>();
  const teamInterestMap = new Map<number, number>();
  const personInterestMap = new Map<number, number>();
  const schoolInterestMap = new Map<number, number>();
  const countryInterestMap = new Map<string, number>(); // key: "countryId-leagueId"

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
      sportInterestMap.set(interest.sport_id, interest.id);
      if (interest.is_focused) focused.add(`sport-${interest.sport_id}`);
    }
    if (interest.league_id !== null && interest.team_id === null && interest.school_id === null && interest.country_id === null) {
      // Pure league follow (not associated with team/school/country)
      leagueIds.push(interest.league_id);
      leagueInterestMap.set(interest.league_id, interest.id);
      if (interest.is_focused) focused.add(`league-${interest.league_id}`);
    }
    if (interest.team_id !== null) {
      teamIds.push(interest.team_id);
      teamInterestMap.set(interest.team_id, interest.id);
      if (interest.is_focused) focused.add(`team-${interest.team_id}`);
    }
    if (interest.person_id !== null) {
      personIds.push(interest.person_id);
      personInterestMap.set(interest.person_id, interest.id);
      if (interest.is_focused) focused.add(`person-${interest.person_id}`);
    }
    if (interest.school_id !== null) {
      schoolIds.push(interest.school_id);
      schoolInterestMap.set(interest.school_id, interest.id);
      if (interest.is_focused) focused.add(`school-${interest.school_id}`);
    }
    // Non-Olympics country interests (e.g., USA in World Cup)
    if (interest.country_id !== null && !interest.is_olympics) {
      countryInterests.push({
        id: interest.id,
        country_id: interest.country_id,
        league_id: interest.league_id,
      });
      const key = `${interest.country_id}-${interest.league_id || 'null'}`;
      countryInterestMap.set(key, interest.id);
      if (interest.is_focused) focused.add(`country-${interest.country_id}`);
    }
  });

  // Collect unique sport/country IDs from olympics interests for batch lookup
  const olympicsSportIds = [...new Set(olympicsInterests.map(o => o.sport_id).filter((id): id is number => id !== null))];
  const olympicsCountryIds = [...new Set(olympicsInterests.map(o => o.country_id).filter((id): id is number => id !== null))];
  
  // Collect unique country IDs from non-Olympics country interests
  const nonOlympicsCountryIds = [...new Set(countryInterests.map(c => c.country_id))];
  const countryLeagueIds = [...new Set(countryInterests.map(c => c.league_id).filter((id): id is number => id !== null))];

  // Fetch all details in parallel
  // Build a map of school_id to league_id from interests for enrichment
  const schoolLeagueMap = new Map<number, number | null>();
  (allInterests || []).forEach(interest => {
    if (interest.school_id !== null) {
      schoolLeagueMap.set(interest.school_id, interest.league_id);
    }
  });

  const [sportsResult, leaguesResult, teamsResult, peopleResult, schoolsResult, leaguesForSchoolsResult, olympicsSportsResult, olympicsCountriesResult, olympicsSportLogosResult, sportMenuLogosResult, leagueMenuLogosResult, nonOlympicsCountriesResult, countryLeaguesResult, countryLeagueMenuLogosResult] = await Promise.all([
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
          country_code,
          last_school_espn_id,
          team_id,
          league_id,
          sport_id,
          school_id,
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
            display_label,
            logo_url
          ),
          schools (
            id,
            name,
            short_name,
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
    // Fetch country details for non-Olympics country interests
    nonOlympicsCountryIds.length > 0
      ? supabase.from("countries").select("id, name, code, logo_url").in("id", nonOlympicsCountryIds)
      : Promise.resolve({ data: [], error: null }),
    // Fetch league details for countries that have league_id
    countryLeagueIds.length > 0
      ? supabase.from("leagues").select("id, code, name, display_label, logo_url").in("id", countryLeagueIds)
      : Promise.resolve({ data: [], error: null }),
    // Fetch logos from preference_menu_items for country leagues (fallback)
    countryLeagueIds.length > 0
      ? supabase.from("preference_menu_items").select("entity_id, label, logo_url").eq("entity_type", "league").in("entity_id", countryLeagueIds)
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

  // Sort and enrich sports with label, logo, and interestId
  const sports: SportWithInterest[] = (sportsResult.data || []).map(sport => {
    const menuData = sportMenuMap.get(sport.id);
    return {
      ...sport,
      interestId: sportInterestMap.get(sport.id) || 0,
      display_label: menuData?.label || sport.display_label || sport.sport,
      logo_url: sport.logo_url || menuData?.logo_url || null,
    };
  }).sort((a, b) => 
    (a.display_label || a.sport).localeCompare(b.display_label || b.sport)
  );
  
  // Sort and enrich leagues with label, logo, and interestId
  const leagues: LeagueWithInterest[] = (leaguesResult.data || []).map(league => {
    const menuData = leagueMenuMap.get(league.id);
    return {
      ...league,
      interestId: leagueInterestMap.get(league.id) || 0,
      name: menuData?.label || league.name,
      logo_url: league.logo_url || menuData?.logo_url || null,
    };
  }).sort((a, b) =>
    (a.code || a.name).localeCompare(b.code || b.name)
  );
  
  // Sort and enrich teams with interestId
  const teams: TeamWithInterest[] = ((teamsResult.data || []) as Team[]).map(team => ({
    ...team,
    interestId: teamInterestMap.get(Number(team.id)) || 0,
  })).sort((a, b) => 
    a.display_name.localeCompare(b.display_name)
  );
  // Fetch countries for people by country_code and logos from preference_menu_items
  const peopleRaw = (peopleResult.data || []) as any[];
  const personCountryCodes = [...new Set(
    peopleRaw.filter(p => p.country_code).map(p => p.country_code as string)
  )];
  
  // Collect sport/league ids for people that need logo lookups
  const peopleSportIdsNeedingLogos = [...new Set(
    peopleRaw.filter(p => p.sport_id && !p.sports?.logo_url).map(p => p.sport_id as number)
  )];
  const peopleLeagueIdsNeedingLogos = [...new Set(
    peopleRaw.filter(p => p.league_id && !p.leagues?.logo_url).map(p => p.league_id as number)
  )];
  
  const [personCountriesResult, peopleMenuItemsResult] = await Promise.all([
    personCountryCodes.length > 0
      ? supabase.from("countries").select("id, name, code, logo_url").in("code", personCountryCodes)
      : Promise.resolve({ data: [] }),
    (peopleSportIdsNeedingLogos.length > 0 || peopleLeagueIdsNeedingLogos.length > 0)
      ? supabase
          .from("preference_menu_items")
          .select("entity_type, entity_id, logo_url")
          .or(
            [
              peopleSportIdsNeedingLogos.length > 0 ? `and(entity_type.eq.sport,entity_id.in.(${peopleSportIdsNeedingLogos.join(',')}))` : null,
              peopleLeagueIdsNeedingLogos.length > 0 ? `and(entity_type.eq.league,entity_id.in.(${peopleLeagueIdsNeedingLogos.join(',')}))` : null
            ].filter(Boolean).join(',')
          )
      : Promise.resolve({ data: [] }),
  ]);
  
  const personCountriesMap = new Map(
    (personCountriesResult.data || []).map((c: any) => [c.code, c])
  );
  
  // Build logo maps from preference_menu_items for people
  const peopleSportLogosMap = new Map<number, string>();
  const peopleLeagueLogosMap = new Map<number, string>();
  for (const item of (peopleMenuItemsResult.data || []) as any[]) {
    if (item.entity_type === 'sport' && item.logo_url) {
      peopleSportLogosMap.set(item.entity_id, item.logo_url);
    } else if (item.entity_type === 'league' && item.logo_url) {
      peopleLeagueLogosMap.set(item.entity_id, item.logo_url);
    }
  }
  
  // Enrich people with country data, sport/league logos, and interestId
  const people: Person[] = peopleRaw.map(person => {
    // Add sport logo from preference_menu_items if missing
    let sports = person.sports;
    if (sports && !sports.logo_url && person.sport_id && peopleSportLogosMap.has(person.sport_id)) {
      sports = { ...sports, logo_url: peopleSportLogosMap.get(person.sport_id) };
    }
    
    // Add league logo from preference_menu_items if missing
    let leagues = person.leagues;
    if (leagues && !leagues.logo_url && person.league_id && peopleLeagueLogosMap.has(person.league_id)) {
      leagues = { ...leagues, logo_url: peopleLeagueLogosMap.get(person.league_id) };
    }
    
    return {
      ...person,
      interestId: personInterestMap.get(person.id) || 0,
      sports,
      leagues,
      countries: person.country_code ? personCountriesMap.get(person.country_code) || null : null,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
  
  // Build league code lookup for schools
  const schoolLeagueCodeMap = new Map((leaguesForSchoolsResult.data || []).map(l => [l.id, l.code]));
  
  // Enrich schools with their league_code and interestId
  const schools: SchoolWithInterest[] = ((schoolsResult.data || []) as School[]).map(school => {
    const leagueId = schoolLeagueMap.get(school.id);
    return {
      ...school,
      interestId: schoolInterestMap.get(school.id) || 0,
      league_code: leagueId ? schoolLeagueCodeMap.get(leagueId) : null,
      league_id: leagueId || null,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  // Build country lookup and league lookup for countries
  const countryLeagueMenuMap = new Map((countryLeagueMenuLogosResult.data || []).map((l: any) => [l.entity_id, { label: l.label, logo_url: l.logo_url }]));
  const countryDetailsMap = new Map(
    (nonOlympicsCountriesResult.data || []).map((c: any) => [c.id, { name: c.name, code: c.code, logo_url: c.logo_url }])
  );
  const countryLeagueMap = new Map((countryLeaguesResult.data || []).map((l: any) => {
    const menuData = countryLeagueMenuMap.get(l.id);
    return [l.id, { 
      code: l.code, 
      name: menuData?.label || l.display_label || l.name, 
      logo_url: l.logo_url || menuData?.logo_url || null 
    }];
  }));
  
  // Enrich countries with their league details and interestId
  const countries: CountryWithInterest[] = countryInterests.map(ci => {
    const details = countryDetailsMap.get(ci.country_id);
    const leagueDetails = ci.league_id ? countryLeagueMap.get(ci.league_id) : null;
    const key = `${ci.country_id}-${ci.league_id || 'null'}`;
    return {
      id: ci.country_id,
      name: details?.name || 'Unknown',
      code: details?.code || '',
      logo_url: details?.logo_url || null,
      interestId: countryInterestMap.get(key) || ci.id,
      league_id: ci.league_id,
      league_code: leagueDetails?.code || null,
      league_name: leagueDetails?.name || null,
      league_logo_url: leagueDetails?.logo_url || null,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  return {
    sports,
    leagues,
    teams,
    people,
    schools,
    countries,
    olympicsPrefs,
    focusedItems: focused,
  };
}

export function useUserPreferences(userId: string | null) {
  return useQuery({
    queryKey: ['userPreferences', userId],
    queryFn: () => fetchUserPreferences(userId!),
    enabled: !!userId,
    // Show cached data instantly, refetch in background for freshness
    refetchOnMount: true,
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
