import { supabase } from "@/integrations/supabase/client";

export interface PersonSearchResult {
  id: number;
  name: string;
  normalized_name?: string;
  role: string;
  position?: string;
  team_id?: number;
  teams?: {
    id: number;
    display_name: string;
    nickname: string;
    logo_url: string | null;
  } | null;
  league_id?: number;
  leagues?: {
    id: number;
    code: string;
    name: string;
    logo_url: string | null;
  } | null;
  sport_id?: number;
  sports?: {
    id: number;
    sport: string;
    display_name: string;
    logo_url: string | null;
  } | null;
}

export async function searchPeople(searchTerm: string): Promise<PersonSearchResult[]> {
  const term = searchTerm.trim();

  if (term.length < 2) {
    return [];
  }

  // Split search into words for fuzzy matching (e.g., "brooke hen" matches "brooke m henderson")
  const words = term.toLowerCase().split(/\s+/).filter(w => w.length >= 2);
  
  if (words.length === 0) {
    return [];
  }

  // Use first word for initial DB query, then filter client-side for all words
  const firstWordPattern = `%${words[0]}%`;

  const { data: people, error: peopleError } = await supabase
    .from("people")
    .select("id, name, normalized_name, role, position, team_id, league_id, sport_id")
    .eq("is_active", true)
    .ilike("normalized_name", firstWordPattern)
    .order("name")
    .limit(100);

  if (peopleError) {
    console.error("Error searching people:", peopleError);
    throw peopleError;
  }

  if (!people || people.length === 0) {
    return [];
  }

  // Filter to only include results where ALL words appear in normalized_name
  const filteredPeople = (people as any[]).filter(person => {
    const normalizedName = person.normalized_name?.toLowerCase() || "";
    return words.every(word => normalizedName.includes(word));
  }).slice(0, 20);

  if (filteredPeople.length === 0) {
    return [];
  }

  const teamIds = [...new Set(filteredPeople.map((p: any) => p.team_id).filter(Boolean))] as number[];
  const leagueIds = [...new Set(filteredPeople.map((p: any) => p.league_id).filter(Boolean))] as number[];
  const sportIds = [...new Set(filteredPeople.map((p: any) => p.sport_id).filter(Boolean))] as number[];

  const [teamsResult, leaguesResult, sportsResult] = await Promise.all([
    teamIds.length > 0
      ? supabase
          .from("teams")
          .select("id, display_name, nickname, logo_url")
          .in("id", teamIds)
      : Promise.resolve({ data: [], error: null }),
    leagueIds.length > 0
      ? supabase
          .from("leagues")
          .select("id, code, name, logo_url")
          .in("id", leagueIds)
      : Promise.resolve({ data: [], error: null }),
    sportIds.length > 0
      ? supabase
          .from("sports")
          .select("id, sport, display_name, logo_url")
          .in("id", sportIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (teamsResult.error) console.error("Error fetching teams:", teamsResult.error);
  if (leaguesResult.error) console.error("Error fetching leagues:", leaguesResult.error);
  if (sportsResult.error) console.error("Error fetching sports:", sportsResult.error);

  const teamsMap = new Map<number, any>((teamsResult.data || []).map((t: any) => [t.id, t]));
  const leaguesMap = new Map<number, any>((leaguesResult.data || []).map((l: any) => [l.id, l]));
  const sportsMap = new Map<number, any>((sportsResult.data || []).map((s: any) => [s.id, s]));

  return filteredPeople.map((person) => ({
    ...person,
    teams: person.team_id ? teamsMap.get(person.team_id) || null : null,
    leagues: person.league_id ? leaguesMap.get(person.league_id) || null : null,
    sports: person.sport_id ? sportsMap.get(person.sport_id) || null : null,
  }));
}
