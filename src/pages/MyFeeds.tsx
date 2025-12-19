import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import dashboardBg from "@/assets/dashboard-bg.png";
type League = Database['public']['Tables']['leagues']['Row'];
type Team = Database['public']['Tables']['teams']['Row'] & {
  leagues?: { code: string } | null;
};
type Sport = Database['public']['Tables']['sports']['Row'];

const COLLEGE_LEAGUES = ['NCAAF', 'NCAAM', 'NCAAW'];
const COUNTRY_TEAM_LEAGUES = ['World Cup', 'WBC'];

interface Person {
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

const getPersonLogo = (person: Person) => {
  if (person.teams?.logo_url) {
    return { url: person.teams.logo_url, alt: person.teams.display_name || 'Team' };
  }
  if (person.leagues?.logo_url) {
    return { url: person.leagues.logo_url, alt: person.leagues.name || 'League' };
  }
  if (person.sports?.logo_url) {
    return { url: person.sports.logo_url, alt: person.sports.display_name || 'Sport' };
  }
  return null;
};

export default function MyFeeds() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedLeagues, setSelectedLeagues] = useState<League[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([]);
  const [selectedSports, setSelectedSports] = useState<Sport[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<Person[]>([]);
  const [toUnfollow, setToUnfollow] = useState<Set<string>>(new Set());
  const [focusedItems, setFocusedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkUserAndLoadFeeds();
  }, []);

  const checkUserAndLoadFeeds = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    await loadFeeds(user.id);
  };

  const loadFeeds = async (userId: string) => {
    setLoading(true);
    try {
      // Fetch all interests with focus status
      const { data: allInterests } = await supabase
        .from("subscriber_interests")
        .select("kind, subject_id, is_focused")
        .eq("subscriber_id", userId);

      if (allInterests) {
        const focused = new Set<string>();
        allInterests.forEach(interest => {
          if (interest.is_focused) {
            focused.add(`${interest.kind}-${interest.subject_id}`);
          }
        });
        setFocusedItems(focused);
      }

      // Fetch selected leagues
      const { data: leagueInterests } = await supabase
        .from("subscriber_interests")
        .select("subject_id")
        .eq("subscriber_id", userId)
        .eq("kind", "league");

      if (leagueInterests && leagueInterests.length > 0) {
        const leagueIds = leagueInterests.map(l => l.subject_id);
        const { data: leagues } = await supabase
          .from("leagues")
          .select("*")
          .in("id", leagueIds);
        
        if (leagues) setSelectedLeagues(leagues.sort((a, b) => (a.code || a.name).localeCompare(b.code || b.name)));
      }

      // Fetch selected teams
      const { data: teamInterests } = await supabase
        .from("subscriber_interests")
        .select("subject_id")
        .eq("subscriber_id", userId)
        .eq("kind", "team");

      if (teamInterests && teamInterests.length > 0) {
        const teamIds = teamInterests.map(t => t.subject_id);
        const { data: teams } = await supabase
          .from("teams")
          .select("*, leagues(code)")
          .in("id", teamIds);
        
        if (teams) setSelectedTeams((teams as Team[]).sort((a, b) => a.display_name.localeCompare(b.display_name)));
      }

      // Fetch selected sports
      const { data: sportInterests } = await supabase
        .from("subscriber_interests")
        .select("subject_id")
        .eq("subscriber_id", userId)
        .eq("kind", "sport");

      if (sportInterests && sportInterests.length > 0) {
        const sportIds = sportInterests.map(s => s.subject_id);
        const { data: sports } = await supabase
          .from("sports")
          .select("*")
          .in("id", sportIds);
        
        if (sports) setSelectedSports(sports.sort((a, b) => a.display_name.localeCompare(b.display_name)));
      }

      // Fetch selected people
      const { data: personInterests } = await supabase
        .from("subscriber_interests")
        .select("subject_id")
        .eq("subscriber_id", userId)
        .eq("kind", "person");

      if (personInterests && personInterests.length > 0) {
        const personIds = personInterests.map(p => p.subject_id);
        const { data: people } = await supabase
          .from("people")
          .select(`
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
          `)
          .in("id", personIds);
        
        if (people) setSelectedPeople((people as Person[]).sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (error) {
      console.error("Error loading feeds:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUnfollow = (kind: 'sport' | 'league' | 'team' | 'person', id: number) => {
    const key = `${kind}-${id}`;
    const newSet = new Set(toUnfollow);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setToUnfollow(newSet);
  };

  const toggleFocus = async (e: React.MouseEvent, kind: 'sport' | 'league' | 'team' | 'person', id: number) => {
    e.stopPropagation();
    try {
      const { data: isFocused } = await supabase.rpc('toggle_interest_focus', {
        p_kind: kind,
        p_subject_id: id
      });

      const key = `${kind}-${id}`;
      const newFocused = new Set(focusedItems);
      if (isFocused) {
        newFocused.add(key);
      } else {
        newFocused.delete(key);
      }
      setFocusedItems(newFocused);
      
      toast.success(isFocused ? "Added to focus" : "Removed from focus");
    } catch (error) {
      console.error("Error toggling focus:", error);
      toast.error("Failed to update focus");
    }
  };

  const handleDeleteSelections = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      for (const key of toUnfollow) {
        const [kind, idStr] = key.split('-');
        const subjectId = Number(idStr);
        
        await supabase.rpc('toggle_subscriber_interest', {
          p_kind: kind as 'sport' | 'league' | 'team' | 'person',
          p_subject_id: subjectId
        });
      }

      // Remove deleted items from state
      setSelectedSports(prev => prev.filter(s => !toUnfollow.has(`sport-${s.id}`)));
      setSelectedLeagues(prev => prev.filter(l => !toUnfollow.has(`league-${l.id}`)));
      setSelectedTeams(prev => prev.filter(t => !toUnfollow.has(`team-${t.id}`)));
      setSelectedPeople(prev => prev.filter(p => !toUnfollow.has(`person-${p.id}`)));
      
      // Clear the unfollow set and hide button
      setToUnfollow(new Set());
      
      toast.success("Selections deleted");
    } catch (error) {
      console.error("Error deleting selections:", error);
      toast.error("Failed to delete selections");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const hasSportsLeaguesTeams = selectedSports.length > 0 || selectedLeagues.length > 0 || selectedTeams.length > 0;

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${dashboardBg})` }}
    >
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 text-center">
          <h1 className="text-xl font-bold">SportsDig Current Feeds</h1>
          <p className="text-sm text-muted-foreground">(Select item to delete)</p>
        </div>
      </header>

      <div className="container mx-auto px-2 py-4 max-w-3xl">
        {/* Navigation Buttons - Centered at top */}
        <div className="flex justify-center gap-2 mb-4">
          <Button size="sm" onClick={() => navigate("/")}>
            Dashboard
          </Button>
          <Button size="sm" onClick={() => navigate("/feed")}>
            Sports Feed
          </Button>
          {toUnfollow.size > 0 && (
            <Button 
              size="sm"
              onClick={handleDeleteSelections}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Deleting...
                </>
              ) : (
                "Delete Selections"
              )}
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {/* Sports/Leagues/Teams Section */}
          <Card>
            <CardHeader className="py-2 space-y-1">
              <CardTitle className="text-base text-center">Sports / Leagues / Teams</CardTitle>
              <div className="flex justify-center">
                <Button size="sm" onClick={() => navigate("/preferences")}>
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              {!hasSportsLeaguesTeams ? (
                <p className="text-muted-foreground text-sm">No sports, leagues, or teams selected</p>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-end px-2">
                    <span className="text-sm text-foreground font-medium">Focus</span>
                  </div>
                  {/* Sports */}
                  {selectedSports.map((sport) => {
                    const key = `sport-${sport.id}`;
                    const isMarked = toUnfollow.has(key);
                    const isFocused = focusedItems.has(key);
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-2 px-2 py-1 border rounded-md cursor-pointer transition-colors w-full ${
                          isMarked ? 'bg-destructive/10 border-destructive' : 'bg-card hover:bg-muted'
                        }`}
                        onClick={() => toggleUnfollow('sport', sport.id)}
                      >
                        {sport.logo_url && (
                          <img src={sport.logo_url} alt="" className="h-5 w-5 object-contain flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium flex-1">{sport.display_name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={(e) => toggleFocus(e, 'sport', sport.id)}
                        >
                          <Star className={`h-4 w-4 transform scale-125 origin-center ${isFocused ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                        </Button>
                      </div>
                    );
                  })}
                  
                  {/* Leagues */}
                  {selectedLeagues.map((league) => {
                    const key = `league-${league.id}`;
                    const isMarked = toUnfollow.has(key);
                    const isFocused = focusedItems.has(key);
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-2 px-2 py-1 border rounded-md cursor-pointer transition-colors w-full ${
                          isMarked ? 'bg-destructive/10 border-destructive' : 'bg-card hover:bg-muted'
                        }`}
                        onClick={() => toggleUnfollow('league', league.id)}
                      >
                        {league.logo_url && (
                          <img src={league.logo_url} alt="" className="h-5 w-5 object-contain flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium flex-1">{league.code || league.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={(e) => toggleFocus(e, 'league', league.id)}
                        >
                          <Star className={`h-4 w-4 transform scale-125 origin-center ${isFocused ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                        </Button>
                      </div>
                    );
                  })}
                  
                  {/* Teams */}
                  {selectedTeams.map((team) => {
                    const key = `team-${team.id}`;
                    const isMarked = toUnfollow.has(key);
                    const isFocused = focusedItems.has(key);
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-2 px-2 py-1 border rounded-md cursor-pointer transition-colors w-full ${
                          isMarked ? 'bg-destructive/10 border-destructive' : 'bg-card hover:bg-muted'
                        }`}
                        onClick={() => toggleUnfollow('team', team.id)}
                      >
                        {team.logo_url && (
                          <img src={team.logo_url} alt="" className="h-5 w-5 object-contain flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium flex-1">
                          {team.display_name}
                          {team.leagues?.code && (COLLEGE_LEAGUES.includes(team.leagues.code) || COUNTRY_TEAM_LEAGUES.includes(team.leagues.code)) && (
                            <span className="text-muted-foreground"> ({team.leagues.code})</span>
                          )}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={(e) => toggleFocus(e, 'team', team.id)}
                        >
                          <Star className={`h-4 w-4 transform scale-125 origin-center ${isFocused ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* People Section */}
          <Card>
            <CardHeader className="py-2 space-y-1">
              <CardTitle className="text-base text-center">Players & Coaches</CardTitle>
              <div className="flex justify-center">
                <Button size="sm" onClick={() => navigate("/player-preferences")}>
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              {selectedPeople.length === 0 ? (
                <p className="text-muted-foreground text-sm">No players or coaches selected</p>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-end px-2">
                    <span className="text-sm text-foreground font-medium">Focus</span>
                  </div>
                  {selectedPeople.map((person) => {
                    const key = `person-${person.id}`;
                    const isMarked = toUnfollow.has(key);
                    const isFocused = focusedItems.has(key);
                    const context = [];
                    if (person.teams?.display_name) context.push(person.teams.display_name);
                    if (person.leagues?.code) context.push(person.leagues.code);
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-2 px-2 py-1 border rounded-md cursor-pointer transition-colors w-full ${
                          isMarked ? 'bg-destructive/10 border-destructive' : 'bg-card hover:bg-muted'
                        }`}
                        onClick={() => toggleUnfollow('person', person.id)}
                      >
                        {(() => {
                          const logo = getPersonLogo(person);
                          return logo ? (
                            <img 
                              src={logo.url} 
                              alt={logo.alt} 
                              className="h-5 w-5 object-contain flex-shrink-0"
                            />
                          ) : null;
                        })()}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold">{person.name}</span>
                          {context.length > 0 && (
                            <span className="text-sm text-muted-foreground ml-1">({context.join(" • ")})</span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 flex-shrink-0"
                          onClick={(e) => toggleFocus(e, 'person', person.id)}
                        >
                          <Star className={`h-4 w-4 transform scale-125 origin-center ${isFocused ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
