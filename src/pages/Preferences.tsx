import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type League = Database['public']['Tables']['leagues']['Row'];
type Sport = Database['public']['Tables']['sports']['Row'];
type Team = Database['public']['Tables']['teams']['Row'];

type DisplayItem = 
  | { type: 'league'; id: number; label?: string }
  | { type: 'sport'; id: number };

// ============================================================
// DISPLAY ORDER CONFIG - Mix sports and leagues in any order
// ============================================================
const DISPLAY_ORDER: DisplayItem[] = [
  { type: 'league', id: 11, label: 'NFL' },
  { type: 'league', id: 1, label: 'MLB' },
  { type: 'league', id: 8, label: 'NBA' },
  { type: 'league', id: 12, label: 'NHL' },
  { type: 'league', id: 13, label: 'WNBA' },
  { type: 'league', id: 9, label: 'NCAAF' },
  { type: 'league', id: 10, label: 'NCAAM' },
  { type: 'league', id: 29, label: 'NCAAW' },
  // Add sports to group their leagues together:
  // { type: 'sport', id: X }
  // All other leagues/sports will appear after these in alphabetical order
];

export default function Preferences() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sports, setSports] = useState<Sport[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedSports, setSelectedSports] = useState<number[]>([]);
  const [selectedLeagues, setSelectedLeagues] = useState<number[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [expandedLeagues, setExpandedLeagues] = useState<number[]>([]);
  const [loadingTeams, setLoadingTeams] = useState<Set<number>>(new Set());

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Ensure subscriber record exists
    try {
      await supabase.rpc('ensure_my_subscriber');
    } catch (error) {
      console.error("Error ensuring subscriber:", error);
    }

    await loadPreferences();
  };

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load all sports
      const { data: sportsData, error: sportsError } = await supabase
        .from("sports")
        .select("*")
        .order("display_name", { ascending: true });

      if (sportsError) throw sportsError;
      setSports(sportsData || []);

      // Load all leagues
      const { data: leaguesData, error: leaguesError } = await supabase
        .from("leagues")
        .select("*")
        .order("name", { ascending: true });

      if (leaguesError) throw leaguesError;
      setLeagues(leaguesData || []);

      // Load user's current interests
      const { data: interests, error: interestsError } = await supabase
        .from("subscriber_interests")
        .select("kind, subject_id")
        .eq("subscriber_id", user.id);

      if (interestsError) throw interestsError;

      // Initialize selected sports, leagues and teams from interests
      const sportIds = interests?.filter(i => i.kind === 'sport').map(i => i.subject_id) || [];
      const leagueIds = interests?.filter(i => i.kind === 'league').map(i => i.subject_id) || [];
      const teamIds = interests?.filter(i => i.kind === 'team').map(i => i.subject_id) || [];

      setSelectedSports(sportIds);
      setSelectedLeagues(leagueIds);
      setSelectedTeams(teamIds);
    } catch (error) {
      console.error("Error loading preferences:", error);
      toast.error("Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  const loadTeamsForLeague = async (leagueId: number) => {
    if (teams.some(t => t.league_id === leagueId)) {
      return; // Already loaded
    }

    setLoadingTeams(prev => new Set(prev).add(leagueId));

    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("*")
        .eq("league_id", leagueId)
        .order("display_name", { ascending: true });

      if (teamsError) throw teamsError;
      setTeams(prev => [...prev, ...(teamsData || [])]);
    } catch (error) {
      console.error(`Error loading teams for league ${leagueId}:`, error);
      toast.error("Failed to load teams");
    } finally {
      setLoadingTeams(prev => {
        const next = new Set(prev);
        next.delete(leagueId);
        return next;
      });
    }
  };

  const handleSportToggle = async (sportId: number) => {
    const sport = sports.find(s => s.id === sportId);
    const label = sport?.display_name || 'sport';

    try {
      const { data: isNowFollowed, error } = await supabase.rpc('toggle_subscriber_interest', {
        p_kind: 'sport',
        p_subject_id: sportId
      });

      if (error) throw error;

      // Optimistic update
      if (isNowFollowed) {
        setSelectedSports(prev => [...prev, sportId]);
        toast.success(`Followed ${label}`);
      } else {
        setSelectedSports(prev => prev.filter(id => id !== sportId));
        toast(`Unfollowed ${label}`);
      }
    } catch (error) {
      console.error("Error toggling sport:", error);
      toast.error("Could not update your preferences. Please try again.");
    }
  };

  const handleLeagueToggle = async (leagueId: number) => {
    const league = leagues.find(l => l.id === leagueId);
    const label = league?.code || league?.name || 'league';

    try {
      const { data: isNowFollowed, error } = await supabase.rpc('toggle_subscriber_interest', {
        p_kind: 'league',
        p_subject_id: leagueId
      });

      if (error) throw error;

      // Optimistic update
      if (isNowFollowed) {
        setSelectedLeagues(prev => [...prev, leagueId]);
        toast.success(`Followed ${label}`);
      } else {
        setSelectedLeagues(prev => prev.filter(id => id !== leagueId));
        toast(`Unfollowed ${label}`);
      }
    } catch (error) {
      console.error("Error toggling league:", error);
      toast.error("Could not update your preferences. Please try again.");
    }
  };

  const handleTeamToggle = async (teamId: number) => {
    const team = teams.find(t => t.id === teamId);
    const label = team?.display_name || 'team';

    try {
      const { data: isNowFollowed, error } = await supabase.rpc('toggle_subscriber_interest', {
        p_kind: 'team',
        p_subject_id: teamId
      });

      if (error) throw error;

      // Optimistic update
      if (isNowFollowed) {
        setSelectedTeams(prev => [...prev, teamId]);
        toast.success(`Followed ${label}`);
      } else {
        setSelectedTeams(prev => prev.filter(id => id !== teamId));
        toast(`Unfollowed ${label}`);
      }
    } catch (error) {
      console.error("Error toggling team:", error);
      toast.error("Could not update your preferences. Please try again.");
    }
  };

  const toggleLeagueExpansion = async (leagueId: number) => {
    const isCurrentlyExpanded = expandedLeagues.includes(leagueId);

    // If clicking the same league, collapse it. Otherwise, expand only the new league
    setExpandedLeagues(isCurrentlyExpanded ? [] : [leagueId]);

    if (!isCurrentlyExpanded) {
      await loadTeamsForLeague(leagueId);
    }
  };

  const getTeamsForLeague = (leagueId: number) => {
    return teams.filter(team => team.league_id === leagueId);
  };

  // Build ordered display items
  const orderedItems: Array<{ type: 'league' | 'sport', item: League | Sport, leagues?: League[] }> = [];
  const renderedLeagueIds = new Set<number>();
  const renderedSportIds = new Set<number>();

  // First, add items from DISPLAY_ORDER
  DISPLAY_ORDER.forEach(displayItem => {
    if (displayItem.type === 'league') {
      const league = leagues.find(l => l.id === displayItem.id);
      if (league) {
        orderedItems.push({ type: 'league', item: league });
        renderedLeagueIds.add(league.id);
      }
    } else {
      const sport = sports.find(s => s.id === displayItem.id);
      if (sport) {
        const sportLeagues = leagues.filter(l => l.sport === sport.sport && !renderedLeagueIds.has(l.id));
        if (sportLeagues.length > 0) {
          orderedItems.push({ type: 'sport', item: sport, leagues: sportLeagues });
          sportLeagues.forEach(l => renderedLeagueIds.add(l.id));
          renderedSportIds.add(sport.id);
        }
      }
    }
  });

  // Then add remaining leagues alphabetically
  const remainingLeagues = leagues.filter(l => !renderedLeagueIds.has(l.id)).sort((a, b) => a.name.localeCompare(b.name));
  remainingLeagues.forEach(league => {
    orderedItems.push({ type: 'league', item: league });
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold mx-auto md:mx-0">Feed Preferences</h1>
            <Button className="w-auto" variant="outline" onClick={() => navigate("/")}>
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4">
        <div className="max-w-4xl mx-auto space-y-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-2xl">Customize Your Sports Feed</CardTitle>
              <CardDescription>
                Your feed will be personalized based on your topic and team selections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              {/* Sports Section */}
              <div className="space-y-1.5 pb-4 border-b">
                <h3 className="text-base font-semibold px-1">Sports</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  {sports.map(sport => (
                    <div key={sport.id} className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                      <Checkbox 
                        id={`sport-${sport.id}`}
                        checked={selectedSports.includes(sport.id)}
                        onCheckedChange={() => handleSportToggle(sport.id)}
                      />
                      <label 
                        htmlFor={`sport-${sport.id}`}
                        className="font-medium cursor-pointer flex-1 min-w-0"
                      >
                        {sport.display_name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leagues & Teams Section */}
              {orderedItems.map((item, index) => {
                if (item.type === 'sport' && item.leagues) {
                  // Render sport header with its leagues
                  return (
                    <div key={`sport-${(item.item as Sport).id}`} className="space-y-2 pb-4">
                      <h3 className="text-base font-semibold capitalize px-1">
                        {(item.item as Sport).display_name}
                      </h3>
                      {item.leagues.map(league => {
                        const leagueTeams = getTeamsForLeague(league.id);
                        const hasTeams = league.kind === 'league' || leagueTeams.length > 0;
                        const isExpanded = expandedLeagues.includes(league.id);

                        return (
                          <div key={league.id} className="space-y-1.5">
                            <div className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                              <Checkbox 
                                id={`league-${league.id}`} 
                                checked={selectedLeagues.includes(league.id)} 
                                onCheckedChange={() => handleLeagueToggle(league.id)} 
                              />
                              {league.logo_url && (
                                <div className="flex items-center justify-center w-10 h-10 shrink-0">
                                  <img 
                                    src={league.logo_url} 
                                    alt={league.name} 
                                    className="h-8 w-8 object-contain" 
                                    onError={(e) => e.currentTarget.style.display = 'none'}
                                  />
                                </div>
                              )}
                              <label 
                                htmlFor={`league-${league.id}`} 
                                className="font-medium cursor-pointer flex-1 min-w-0"
                              >
                                {league.name}
                              </label>
                              {hasTeams && (
                                <Button 
                                  variant={isExpanded ? "default" : "outline"} 
                                  size="sm" 
                                  onClick={() => toggleLeagueExpansion(league.id)} 
                                  className={`shrink-0 transition-colors ${isExpanded ? 'bg-foreground text-background hover:bg-foreground/90' : ''}`}
                                >
                                  Teams
                                </Button>
                              )}
                            </div>

                            {hasTeams && isExpanded && (
                              <div className="ml-6 space-y-1.5 p-3 bg-muted/30 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                  {leagueTeams.map(team => (
                                    <div 
                                      key={team.id} 
                                      className="flex items-center gap-2 p-1.5 rounded hover:bg-background transition-colors"
                                    >
                                      <Checkbox 
                                        id={`team-${team.id}`} 
                                        checked={selectedTeams.includes(team.id)} 
                                        onCheckedChange={() => handleTeamToggle(team.id)} 
                                      />
                                      {team.logo_url && (
                                        <div className="flex items-center justify-center w-7 h-7 flex-shrink-0">
                                          <img 
                                            src={team.logo_url} 
                                            alt={team.display_name} 
                                            className="h-7 w-7 object-contain" 
                                            onError={(e) => e.currentTarget.style.display = 'none'}
                                          />
                                        </div>
                                      )}
                                      <label 
                                        htmlFor={`team-${team.id}`} 
                                        className="text-sm cursor-pointer flex-1"
                                      >
                                        {team.display_name}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                } else {
                  // Render individual league
                  const league = item.item as League;
                  const leagueTeams = getTeamsForLeague(league.id);
                  const hasTeams = league.kind === 'league' || leagueTeams.length > 0;
                  const isExpanded = expandedLeagues.includes(league.id);
                  
                  // Get custom label from config or use name
                  const displayConfig = DISPLAY_ORDER.find(d => d.type === 'league' && d.id === league.id);
                  const displayName = (displayConfig?.type === 'league' && displayConfig.label) || league.name;

                  return (
                    <div key={league.id} className="space-y-1.5 pb-3">
                      <div className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                        <Checkbox 
                          id={`league-${league.id}`} 
                          checked={selectedLeagues.includes(league.id)} 
                          onCheckedChange={() => handleLeagueToggle(league.id)} 
                        />
                        {league.logo_url && (
                          <div className="flex items-center justify-center w-10 h-10 shrink-0">
                            <img 
                              src={league.logo_url} 
                              alt={displayName} 
                              className="h-8 w-8 object-contain" 
                              onError={(e) => e.currentTarget.style.display = 'none'}
                            />
                          </div>
                        )}
                        <label 
                          htmlFor={`league-${league.id}`} 
                          className="font-medium cursor-pointer flex-1 min-w-0"
                        >
                          {displayName}
                        </label>
                        {hasTeams && (
                          <Button 
                            variant={isExpanded ? "default" : "outline"} 
                            size="sm" 
                            onClick={() => toggleLeagueExpansion(league.id)} 
                            className={`shrink-0 transition-colors ${isExpanded ? 'bg-foreground text-background hover:bg-foreground/90' : ''}`}
                          >
                            Teams
                          </Button>
                        )}
                      </div>

                      {hasTeams && isExpanded && (
                        <div className="ml-6 space-y-1.5 p-3 bg-muted/30 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                            {leagueTeams.map(team => (
                              <div 
                                key={team.id} 
                                className="flex items-center gap-2 p-1.5 rounded hover:bg-background transition-colors"
                              >
                                <Checkbox 
                                  id={`team-${team.id}`} 
                                  checked={selectedTeams.includes(team.id)} 
                                  onCheckedChange={() => handleTeamToggle(team.id)} 
                                />
                                {team.logo_url && (
                                  <div className="flex items-center justify-center w-7 h-7 flex-shrink-0">
                                    <img 
                                      src={team.logo_url} 
                                      alt={team.display_name} 
                                      className="h-7 w-7 object-contain" 
                                      onError={(e) => e.currentTarget.style.display = 'none'}
                                    />
                                  </div>
                                )}
                                <label 
                                  htmlFor={`team-${team.id}`} 
                                  className="text-sm cursor-pointer flex-1"
                                >
                                  {team.display_name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
              })}
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground text-center py-2">
            {selectedSports.length} sports, {selectedLeagues.length} leagues, {selectedTeams.length} teams selected • Changes save automatically
          </div>
        </div>
      </main>
    </div>
  );
}
