import { supabase } from "@/integrations/supabase/client";

export interface SchoolSearchResult {
  id: number;
  school_id: number;
  name: string;
  short_name: string;
  logo_url: string | null;
  league_id: number | null;
  league_code: string | null;
  display_label: string; // e.g., "Penn State Nittany Lions (NCAAF)" or "Penn State Nittany Lions (All Sports)"
}

export async function searchSchools(searchTerm: string): Promise<SchoolSearchResult[]> {
  const term = searchTerm.trim().toLowerCase();

  if (term.length < 2) {
    return [];
  }

  // First, find matching schools
  const { data: matchingSchools, error: schoolsError } = await supabase
    .from("schools")
    .select("id, name, short_name, logo_url, aliases")
    .or(`name.ilike.%${term}%,short_name.ilike.%${term}%`)
    .order("name")
    .limit(20);

  if (schoolsError) {
    console.error("Error searching schools:", schoolsError);
    throw schoolsError;
  }

  if (!matchingSchools || matchingSchools.length === 0) {
    // Also check aliases
    const { data: aliasMatches, error: aliasError } = await supabase
      .from("schools")
      .select("id, name, short_name, logo_url, aliases")
      .order("name")
      .limit(100);

    if (aliasError) {
      console.error("Error fetching schools for alias search:", aliasError);
      return [];
    }

    // Filter by alias match client-side
    const filteredByAlias = (aliasMatches || []).filter(school => 
      school.aliases?.some(alias => alias.toLowerCase().includes(term))
    ).slice(0, 20);

    if (filteredByAlias.length === 0) {
      return [];
    }

    return await expandSchoolsWithLeagues(filteredByAlias);
  }

  return await expandSchoolsWithLeagues(matchingSchools);
}

async function expandSchoolsWithLeagues(
  schools: Array<{
    id: number;
    name: string;
    short_name: string;
    logo_url: string | null;
    aliases: string[] | null;
  }>
): Promise<SchoolSearchResult[]> {
  const schoolIds = schools.map(s => s.id);

  // Get all league associations for these schools
  const { data: leagueSchools, error: leagueError } = await supabase
    .from("league_schools")
    .select(`
      school_id,
      league_id,
      leagues!inner(id, code, name)
    `)
    .in("school_id", schoolIds)
    .eq("is_active", true);

  if (leagueError) {
    console.error("Error fetching league_schools:", leagueError);
    // Fall back to just returning schools without league info
    return schools.map(school => ({
      id: school.id,
      school_id: school.id,
      name: school.name,
      short_name: school.short_name,
      logo_url: school.logo_url,
      league_id: null,
      league_code: null,
      display_label: `${school.name} (All Sports)`,
    }));
  }

  // Build a map of school_id -> league associations
  const schoolLeagueMap = new Map<number, Array<{ league_id: number; league_code: string }>>();
  
  for (const ls of leagueSchools || []) {
    const league = ls.leagues as unknown as { id: number; code: string; name: string };
    if (!league) continue;
    
    if (!schoolLeagueMap.has(ls.school_id)) {
      schoolLeagueMap.set(ls.school_id, []);
    }
    schoolLeagueMap.get(ls.school_id)!.push({
      league_id: league.id,
      league_code: league.code,
    });
  }

  // Define priority order for college leagues
  const leaguePriority: Record<string, number> = {
    'NCAAF': 1,
    'NCAAM': 2,
    'NCAAW': 3,
    'NCAAB': 4,
    'NCAAMSOC': 5,
    'NCAAWSOC': 6,
    'NCAAMH': 7,
    'NCAAWH': 8,
    'NCAASB': 9,
  };

  // Build results: for each school, create entries for each league + "All Sports"
  const results: SchoolSearchResult[] = [];

  for (const school of schools) {
    const leagues = schoolLeagueMap.get(school.id) || [];
    
    // Sort leagues by priority
    const sortedLeagues = [...leagues].sort((a, b) => {
      const priorityA = leaguePriority[a.league_code] ?? 100;
      const priorityB = leaguePriority[b.league_code] ?? 100;
      return priorityA - priorityB;
    });

    // Add league-specific entries
    for (const league of sortedLeagues) {
      results.push({
        id: school.id * 10000 + league.league_id, // Unique key for each school+league combo
        school_id: school.id,
        name: school.name,
        short_name: school.short_name,
        logo_url: school.logo_url,
        league_id: league.league_id,
        league_code: league.league_code,
        display_label: `${school.name} (${league.league_code})`,
      });
    }

    // Always add "All Sports" option at the end
    results.push({
      id: school.id, // Use school.id for "All Sports" since league_id is null
      school_id: school.id,
      name: school.name,
      short_name: school.short_name,
      logo_url: school.logo_url,
      league_id: null,
      league_code: null,
      display_label: `${school.name} (All Sports)`,
    });
  }

  return results;
}
