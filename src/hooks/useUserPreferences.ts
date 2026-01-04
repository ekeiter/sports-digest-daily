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

export interface UserPreferences {
  sports: Sport[];
  leagues: League[];
  teams: Team[];
  people: Person[];
  focusedItems: Set<string>;
}

async function fetchUserPreferences(userId: string): Promise<UserPreferences> {
  // Single query to get all interests with focus status using explicit FK columns
  const { data: allInterests, error: interestsError } = await supabase
    .from("subscriber_interests")
    .select("sport_id, league_id, team_id, person_id, is_focused")
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

  (allInterests || []).forEach(interest => {
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
  });

  // Fetch all details in parallel
  const [sportsResult, leaguesResult, teamsResult, peopleResult] = await Promise.all([
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
  ]);

  // Sort results alphabetically
  const sports = (sportsResult.data || []).sort((a, b) => 
    a.display_name.localeCompare(b.display_name)
  );
  const leagues = (leaguesResult.data || []).sort((a, b) => 
    (a.code || a.name).localeCompare(b.code || b.name)
  );
  const teams = ((teamsResult.data || []) as Team[]).sort((a, b) => 
    a.display_name.localeCompare(b.display_name)
  );
  const people = ((peopleResult.data || []) as Person[]).sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  return {
    sports,
    leagues,
    teams,
    people,
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
