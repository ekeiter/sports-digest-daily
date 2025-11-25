import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type League = Database['public']['Tables']['leagues']['Row'];
type Sport = Database['public']['Tables']['sports']['Row'];
type Team = Database['public']['Tables']['teams']['Row'];

type DisplayItem = 
  | { type: 'league'; data: League }
  | { type: 'sport'; data: Sport };

export default function Preferences() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [displayItems, setDisplayItems] = useState<DisplayItem[]>([]);
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

      // Load sports with app_order_id NOT NULL
      const { data: sportsData, error: sportsError } = await supabase
        .from("sports")
        .select("*")
        .not("app_order_id", "is", null)
        .order("app_order_id", { ascending: true });

      if (sportsError) throw sportsError;

      // Load leagues with app_order_id NOT NULL
      const { data: leaguesData, error: leaguesError } = await supabase
        .from("leagues")
        .select("*")
        .not("app_order_id", "is", null)
        .order("app_order_id", { ascending: true });

      if (leaguesError) throw leaguesError;

      // Merge sports and leagues into unified display list, sorted by app_order_id
      const combined: DisplayItem[] = [
        ...(sportsData || []).map(s => ({ type: 'sport' as const, data: s })),
        ...(leaguesData || []).map(l => ({ type: 'league' as const, data: l }))
      ];

      combined.sort((a, b) => {
        const orderA = a.type === 'sport' ? a.data.app_order_id : a.data.app_order_id;
        const orderB = b.type === 'sport' ? b.data.app_order_id : b.data.app_order_id;
        return (orderA || 0) - (orderB || 0);
      });

      setDisplayItems(combined);

      // Load user's current interests
      const { data: interests, error: interestsError } = await supabase
        .from("subscriber_interests")
        .select("kind, subject_id")
        .eq("subscriber_id", user.id);

      if (interestsError) throw interestsError;

      const sportIds = interests?.filter(i => i.kind === 'sport').map(i => i.subject_id) || [];
      const leagueIds = interests?.filter(i => i.kind === 'league').map(i => i.subject_id) || [];
      const teamIds = interests?.filter(i => i.kind === 'team').map(i => i.subject_id) || [];

      setSelectedSports(sportIds);
      setSelectedLeagues(leagueIds);
      setSelectedTeams(teamIds);

      // Load teams that are selected so we can show counts
      if (teamIds.length > 0) {
        const { data: selectedTeamsData } = await supabase
          .from("teams")
          .select("*")
          .in("id", teamIds);
        
        if (selectedTeamsData) {
          setTeams(selectedTeamsData);
        }
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
      toast.error("Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  const loadTeamsForLeague = async (leagueId: number) => {
    if (teams.some(t => t.league_id === leagueId)) {
      return;
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
    const item = displayItems.find(i => i.type === 'sport' && i.data.id === sportId);
    const sport = item?.type === 'sport' ? item.data : null;
    const label = sport?.display_label || sport?.display_name || 'sport';

    try {
      const { data: isNowFollowed, error } = await supabase.rpc('toggle_subscriber_interest', {
        p_kind: 'sport',
        p_subject_id: sportId
      });

      if (error) throw error;

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
    const item = displayItems.find(i => i.type === 'league' && i.data.id === leagueId);
    const league = item?.type === 'league' ? item.data : null;
    const label = league?.display_label || league?.code || league?.name || 'league';

    try {
      const { data: isNowFollowed, error } = await supabase.rpc('toggle_subscriber_interest', {
        p_kind: 'league',
        p_subject_id: leagueId
      });

      if (error) throw error;

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
    setExpandedLeagues(isCurrentlyExpanded ? [] : [leagueId]);

    if (!isCurrentlyExpanded) {
      await loadTeamsForLeague(leagueId);
    }
  };

  const getTeamsForLeague = (leagueId: number) => {
    return teams.filter(team => team.league_id === leagueId);
  };

  const getSelectedTeamCountForLeague = (leagueId: number) => {
    const leagueTeams = teams.filter(t => t.league_id === leagueId);
    return leagueTeams.filter(t => selectedTeams.includes(t.id)).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold">Sports Feed Preferences</h1>
            <div className="flex gap-2">
              <Button className="w-auto" onClick={() => navigate("/")}>
                Dashboard
              </Button>
              {expandedLeagues.length > 0 && (
                <Button className="w-auto" onClick={() => setExpandedLeagues([])}>
                  Close Teams
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-0 sm:px-4 py-2">
        <div className="max-w-5xl mx-auto">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-2 pt-0">
              <CardDescription className="text-foreground">
                Select your sport and teams by clicking on them directly
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex">
                {/* Left panel - Sports/Leagues */}
                <div className={`space-y-2 ${expandedLeagues.length > 0 ? 'w-1/2 border-r pr-3' : 'w-full'}`}>
                  {displayItems.map((item) => {
                    if (item.type === 'sport') {
                      const sport = item.data;
                      const displayName = sport.display_label || sport.display_name;
                      const isSelected = selectedSports.includes(sport.id);
                      
                      return (
                        <div 
                          key={`sport-${sport.id}`} 
                          onClick={() => handleSportToggle(sport.id)}
                          className={`flex items-center gap-1.5 p-2 rounded-lg border cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-primary/15 border-primary text-foreground' 
                              : 'bg-card hover:bg-accent/5 border-border'
                          }`}
                        >
                          {sport.logo_url && (
                            <div className="flex items-center justify-center w-8 h-8 shrink-0">
                              <img 
                                src={sport.logo_url} 
                                alt={displayName} 
                                className="h-7 w-7 object-contain" 
                                onError={(e) => e.currentTarget.style.display = 'none'}
                              />
                            </div>
                          )}
                          <span className="font-medium flex-1 min-w-0">
                            {displayName}
                          </span>
                        </div>
                      );
                    } else {
                      const league = item.data;
                      const hasTeams = league.kind === 'league';
                      const isExpanded = expandedLeagues.includes(league.id);
                      const displayName = league.display_label || league.name;
                      const isSelected = selectedLeagues.includes(league.id);

                      return (
                        <div 
                          key={`league-${league.id}`} 
                          className={`flex items-center gap-1.5 p-2 rounded-lg border transition-colors ${
                            isSelected 
                              ? 'bg-primary/15 border-primary text-foreground' 
                              : 'bg-card hover:bg-accent/5 border-border'
                          }`}
                        >
                          <div 
                            onClick={() => handleLeagueToggle(league.id)}
                            className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer"
                          >
                            {league.logo_url && (
                              <div className="flex items-center justify-center w-8 h-8 shrink-0">
                                <img 
                                  src={league.logo_url} 
                                  alt={displayName} 
                                  className="h-7 w-7 object-contain" 
                                  onError={(e) => e.currentTarget.style.display = 'none'}
                                />
                              </div>
                            )}
                            <span className="font-medium flex-1 min-w-0">
                              {displayName}
                            </span>
                          </div>
                          {hasTeams && expandedLeagues.length === 0 && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                loadTeamsForLeague(league.id).then(() => {
                                  toggleLeagueExpansion(league.id);
                                });
                              }} 
                              className="shrink-0 transition-colors w-20 justify-center"
                            >
                              Teams
                              {(() => {
                                const count = getSelectedTeamCountForLeague(league.id);
                                return count > 0 ? ` (${count})` : '';
                              })()}
                            </Button>
                          )}
                        </div>
                      );
                    }
                  })}
                </div>

                {/* Right panel - Teams */}
                {expandedLeagues.length > 0 && (
                  <div className="w-1/2 pl-3">
                    {expandedLeagues.map(leagueId => {
                      const leagueTeams = getTeamsForLeague(leagueId);
                      const league = displayItems.find(i => i.type === 'league' && i.data.id === leagueId);
                      const leagueName = league?.type === 'league' ? (league.data.display_label || league.data.name) : '';
                      
                      return (
                        <div key={leagueId} className="space-y-2">
                          <h3 className="font-semibold text-sm text-muted-foreground">{leagueName} Teams</h3>
                          {loadingTeams.has(leagueId) ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {leagueTeams.map(team => {
                                const isSelected = selectedTeams.includes(team.id);
                                return (
                                  <div 
                                    key={team.id} 
                                    onClick={() => handleTeamToggle(team.id)}
                                    className={`flex items-center gap-1.5 p-1.5 rounded cursor-pointer transition-colors border h-14 ${
                                      isSelected 
                                        ? 'bg-primary/15 border-primary' 
                                        : 'bg-card hover:bg-accent/5 border-border'
                                    }`}
                                  >
                                    {team.logo_url && (
                                      <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
                                        <img 
                                          src={team.logo_url} 
                                          alt={team.display_name} 
                                          className="h-7 w-7 object-contain" 
                                          onError={(e) => e.currentTarget.style.display = 'none'}
                                        />
                                      </div>
                                    )}
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <span className="text-xs text-muted-foreground truncate">
                                        {team.city_state_name}
                                      </span>
                                      <span className="text-sm font-medium truncate">
                                        {team.nickname || team.display_name}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
