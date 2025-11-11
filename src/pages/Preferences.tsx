import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type League = Database['public']['Tables']['leagues']['Row'] & { logo_url?: string };
type Team = Database['public']['Tables']['teams']['Row'] & { logo_url?: string };
type Sport = Database['public']['Tables']['sports']['Row'];
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
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
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
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;

      // Load all sports
      const {
        data: sportsData,
        error: sportsError
      } = await supabase.from("sports").select("*").order("display_name", {
        ascending: true
      });
      if (sportsError) throw sportsError;
      setSports(sportsData || []);

      // Load all leagues
      const {
        data: leaguesData,
        error: leaguesError
      } = await supabase.from("leagues").select("*").order("sport", {
        ascending: true
      }).order("name", {
        ascending: true
      });
      if (leaguesError) throw leaguesError;
      setLeagues(leaguesData || []);

      // Load user's current interests
      const {
        data: interests,
        error: interestsError
      } = await supabase.from("subscriber_interests").select("kind, subject_id").eq("subscriber_id", user.id);
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
    if (teams.some(t => t.topic_id === leagueId)) {
      return; // Already loaded
    }
    setLoadingTeams(prev => new Set(prev).add(leagueId));
    try {
      const {
        data: teamsData,
        error: teamsError
      } = await supabase.from("teams").select("*").eq("topic_id", leagueId).order("display_name", {
        ascending: true
      });
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
      const {
        data: isNowFollowed,
        error
      } = await supabase.rpc('toggle_subscriber_interest' as any, {
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
      const {
        data: isNowFollowed,
        error
      } = await supabase.rpc('toggle_subscriber_interest' as any, {
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
      const {
        data: isNowFollowed,
        error
      } = await supabase.rpc('toggle_subscriber_interest' as any, {
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
    return teams.filter(team => team.topic_id === leagueId);
  };
  const otherLeaguesList = ['archery', 'badminton', 'beach volleyball', 'canoe and kayak', 'competitive eating', 'darts', 'diving', 'equestrian', 'fencing', 'field hockey', 'figure skating', 'gymnastics', 'handball', 'judo', 'modern pentathlon', 'pickleball', 'poker', 'rodeo', 'rowing', 'sailing', 'shooting', 'skateboarding', 'skiing and snowboarding', 'surfing', 'swimming', 'table tennis', 'triathlon', 'water polo', 'weightlifting', 'professional football'];
  const groupedLeagues = leagues.reduce((acc, league) => {
    // Extract NFL to be standalone - ONLY the actual NFL (id: 11), not other leagues with "National Football League" in the name
    if (league.id === 11) {
      if (!acc['nfl-standalone']) {
        acc['nfl-standalone'] = [];
      }
      acc['nfl-standalone'].push(league);
      return acc;
    }

    // Extract NBA to be standalone (but not WNBA)
    if (league.name.toLowerCase().includes('national basketball association') && !league.name.toLowerCase().includes('women')) {
      if (!acc['nba-standalone']) {
        acc['nba-standalone'] = [];
      }
      acc['nba-standalone'].push(league);
      return acc;
    }

    // Extract NHL to be standalone
    if (league.name.toLowerCase().includes('national hockey league')) {
      if (!acc['nhl-standalone']) {
        acc['nhl-standalone'] = [];
      }
      acc['nhl-standalone'].push(league);
      return acc;
    }
    const isOtherLeague = otherLeaguesList.some(other => league.sport.toLowerCase().includes(other.toLowerCase()));
    const groupKey = isOtherLeague ? 'other sports' : league.sport;
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(league);
    return acc;
  }, {} as Record<string, League[]>);

  // Sort "other sports" alphabetically by name
  if (groupedLeagues['other sports']) {
    groupedLeagues['other sports'].sort((a, b) => a.name.localeCompare(b.name));
  }

  // Sort the groups: MLB, NFL, NBA, NHL, WNBA, College Football, Men's CBB, Women's CBB, PGA, LPGA, LIV Golf, Soccer, College Football - FCS, College Baseball, then others
  const sortedGroupEntries = Object.entries(groupedLeagues).sort(([keyA], [keyB]) => {
    const aIsBaseball = keyA.toLowerCase().includes('professional baseball');
    const bIsBaseball = keyB.toLowerCase().includes('professional baseball');
    const aIsNFL = keyA === 'nfl-standalone';
    const bIsNFL = keyB === 'nfl-standalone';
    const aIsNBA = keyA === 'nba-standalone';
    const bIsNBA = keyB === 'nba-standalone';
    const aIsNHL = keyA === 'nhl-standalone';
    const bIsNHL = keyB === 'nhl-standalone';
    const aIsProBasketball = keyA.toLowerCase().includes('professional basketball');
    const bIsProBasketball = keyB.toLowerCase().includes('professional basketball');
    const aIsCollegeFootballFBS = keyA.toLowerCase().includes('college football') && !keyA.toLowerCase().includes('fcs');
    const bIsCollegeFootballFBS = keyB.toLowerCase().includes('college football') && !keyB.toLowerCase().includes('fcs');
    const aIsCollegeFootballFCS = keyA.toLowerCase().includes('college football') && keyA.toLowerCase().includes('fcs');
    const bIsCollegeFootballFCS = keyB.toLowerCase().includes('college football') && keyB.toLowerCase().includes('fcs');
    const aIsCollegeBaseball = keyA.toLowerCase().includes('college baseball');
    const bIsCollegeBaseball = keyB.toLowerCase().includes('college baseball');
    const aIsCollegeBasketball = keyA.toLowerCase() === 'college basketball';
    const bIsCollegeBasketball = keyB.toLowerCase() === 'college basketball';
    const aIsGolf = keyA.toLowerCase() === 'golf';
    const bIsGolf = keyB.toLowerCase() === 'golf';
    const aIsSoccer = keyA.toLowerCase().includes('soccer');
    const bIsSoccer = keyB.toLowerCase().includes('soccer');
    if (aIsBaseball) return -1;
    if (bIsBaseball) return 1;
    if (aIsNFL) return -1;
    if (bIsNFL) return 1;
    if (aIsNBA) return -1;
    if (bIsNBA) return 1;
    if (aIsNHL) return -1;
    if (bIsNHL) return 1;
    if (aIsProBasketball) return -1;
    if (bIsProBasketball) return 1;
    if (aIsCollegeFootballFBS) return -1;
    if (bIsCollegeFootballFBS) return 1;
    if (aIsCollegeBasketball) return -1;
    if (bIsCollegeBasketball) return 1;
    if (aIsGolf) return -1;
    if (bIsGolf) return 1;
    if (aIsSoccer) return -1;
    if (bIsSoccer) return 1;
    if (aIsCollegeBaseball) return -1;
    if (bIsCollegeBaseball) return 1;
    if (aIsCollegeFootballFCS) return -1;
    if (bIsCollegeFootballFCS) return 1;
    if (keyA === 'other sports') return 1;
    if (keyB === 'other sports') return -1;
    return keyA.localeCompare(keyB);
  });
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>;
  }
  return <div className="min-h-screen bg-background">
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
              {sortedGroupEntries.map(([sport, sportLeagues]) => <div key={sport} className="space-y-1.5">
                  {sport !== 'nfl-standalone' && sport !== 'nba-standalone' && sport !== 'nhl-standalone' && !sport.toLowerCase().includes('college football') && !sport.toLowerCase().includes('college basketball') && (sportLeagues.length > 1 || sport === 'other sports') && <h3 className="text-base font-semibold capitalize px-1">{sport}</h3>}
                  
                  {sportLeagues.map((league, index) => {
                const leagueTeams = getTeamsForLeague(league.id);
                const hasTeams = league.kind === 'league' || leagueTeams.length > 0;
                const isExpanded = expandedLeagues.includes(league.id);
                const isMLB = league.name.toLowerCase().includes('major league baseball');
                const isNFL = sport === 'nfl-standalone'; // Only true NFL from standalone group
                const isNBA = sport === 'nba-standalone'; // Only true NBA from standalone group
                const isNHL = sport === 'nhl-standalone'; // Only true NHL from standalone group
                const isWNBA = league.name.toLowerCase().includes('women') && league.name.toLowerCase().includes('national basketball association');
                const isNCAAF = league.name.toLowerCase().includes('college football');
                const isNCAAM = league.id === 10; // Men's College Basketball
                const isNCAAW = league.id === 29; // Women's College Basketball

                // For college football, use index to differentiate FBS (0) and FCS (1)
                let displayName = league.name;
                if (isMLB) displayName = 'MLB';else if (isNFL) displayName = 'NFL';else if (isNBA) displayName = 'NBA';else if (isNHL) displayName = 'NHL';else if (isWNBA) displayName = 'WNBA';else if (isNCAAM) displayName = 'NCAAM';else if (isNCAAW) displayName = 'NCAAW';else if (isNCAAF) {
                  const ncaafLeagues = sportLeagues.filter(l => l.name.toLowerCase().includes('college football'));
                  const ncaafIndex = ncaafLeagues.findIndex(l => l.id === league.id);
                  displayName = ncaafIndex === 0 ? 'NCAAF' : 'NCAAF - FCS';
                }
                return <div key={league.id} className="space-y-1.5">
                        <div className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                          <Checkbox id={`league-${league.id}`} checked={selectedLeagues.includes(league.id)} onCheckedChange={() => handleLeagueToggle(league.id)} />
                          {league.logo_url && <div className="flex items-center justify-center w-10 h-10 shrink-0">
                              <img 
                                src={league.logo_url} 
                                alt={displayName} 
                                className="h-8 w-8 object-contain" 
                                onError={(e) => e.currentTarget.style.display = 'none'}
                              />
                            </div>}
                          <label htmlFor={`league-${league.id}`} className="font-medium cursor-pointer flex-1 min-w-0">
                            {displayName}
                          </label>
                          {hasTeams && <Button 
                              variant={isExpanded ? "default" : "outline"} 
                              size="sm" 
                              onClick={() => toggleLeagueExpansion(league.id)} 
                              className={`shrink-0 transition-colors ${isExpanded ? 'bg-foreground text-background hover:bg-foreground/90' : ''}`}
                            >
                              Teams
                            </Button>}
                        </div>

                        {hasTeams && isExpanded && <div className="ml-6 space-y-1.5 p-3 bg-muted/30 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                              {leagueTeams.map(team => {
                        return <div key={team.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-background transition-colors">
                                    <Checkbox id={`team-${team.id}`} checked={selectedTeams.includes(team.id)} onCheckedChange={() => handleTeamToggle(team.id)} />
                                    {team.logo_url && <div className="flex items-center justify-center w-7 h-7 flex-shrink-0">
                                        <img 
                                          src={team.logo_url} 
                                          alt={team.display_name} 
                                          className="h-7 w-7 object-contain" 
                                          onError={(e) => e.currentTarget.style.display = 'none'}
                                        />
                                      </div>}
                                    <label htmlFor={`team-${team.id}`} className="text-sm cursor-pointer flex-1">
                                      {team.display_name}
                                    </label>
                                  </div>;
                      })}
                            </div>
                          </div>}
                      </div>;
              })}
                </div>)}
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground text-center py-2">
            {selectedSports.length} sports, {selectedLeagues.length} leagues, {selectedTeams.length} teams selected • Changes save automatically
          </div>
        </div>
      </main>
    </div>;
}