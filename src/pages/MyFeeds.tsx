import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type League = Database['public']['Tables']['leagues']['Row'];
type Team = Database['public']['Tables']['teams']['Row'];
type Sport = Database['public']['Tables']['sports']['Row'];

interface Person {
  id: number;
  name: string;
  role: string;
  position?: string;
  teams?: {
    display_name: string;
    nickname: string;
  } | null;
  leagues?: {
    code: string;
    name: string;
  } | null;
}

export default function MyFeeds() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedLeagues, setSelectedLeagues] = useState<League[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([]);
  const [selectedSports, setSelectedSports] = useState<Sport[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<Person[]>([]);
  const [toUnfollow, setToUnfollow] = useState<Set<string>>(new Set());

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
        
        if (leagues) setSelectedLeagues(leagues);
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
          .select("*")
          .in("id", teamIds);
        
        if (teams) setSelectedTeams(teams);
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
        
        if (sports) setSelectedSports(sports);
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
              nickname
            ),
            leagues (
              code,
              name
            )
          `)
          .in("id", personIds);
        
        if (people) setSelectedPeople(people as Person[]);
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

  const handleSaveChanges = async () => {
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

      toast.success("Feed preferences updated");
      navigate("/");
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Failed to save changes");
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
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-center">SportsDig Current Feeds</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 max-w-4xl">
        {/* Action Buttons - Moved to top */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button size="sm" variant="outline" onClick={() => navigate("/")}>
            Dashboard
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate("/preferences")}>
            Manage Sports/Leagues/Teams
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate("/player-preferences")}>
            Manage Player Preferences
          </Button>
          {toUnfollow.size > 0 && (
            <Button 
              size="sm"
              onClick={handleSaveChanges}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {/* Sports/Leagues/Teams Section */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Sports / Leagues / Teams</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              {!hasSportsLeaguesTeams ? (
                <p className="text-muted-foreground text-sm">No sports, leagues, or teams selected</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {/* Sports */}
                  {selectedSports.map((sport) => {
                    const key = `sport-${sport.id}`;
                    const isMarked = toUnfollow.has(key);
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-2 px-2 py-1 border rounded-md cursor-pointer transition-colors ${
                          isMarked ? 'bg-destructive/10 border-destructive' : 'bg-card hover:bg-muted'
                        }`}
                        onClick={() => toggleUnfollow('sport', sport.id)}
                      >
                        {sport.logo_url && (
                          <img src={sport.logo_url} alt="" className="h-5 w-5 object-contain" />
                        )}
                        <span className="text-sm font-medium">{sport.display_name}</span>
                      </div>
                    );
                  })}
                  
                  {/* Leagues */}
                  {selectedLeagues.map((league) => {
                    const key = `league-${league.id}`;
                    const isMarked = toUnfollow.has(key);
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-2 px-2 py-1 border rounded-md cursor-pointer transition-colors ${
                          isMarked ? 'bg-destructive/10 border-destructive' : 'bg-card hover:bg-muted'
                        }`}
                        onClick={() => toggleUnfollow('league', league.id)}
                      >
                        {league.logo_url && (
                          <img src={league.logo_url} alt="" className="h-5 w-5 object-contain" />
                        )}
                        <span className="text-sm font-medium">{league.code || league.name}</span>
                      </div>
                    );
                  })}
                  
                  {/* Teams */}
                  {selectedTeams.map((team) => {
                    const key = `team-${team.id}`;
                    const isMarked = toUnfollow.has(key);
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-2 px-2 py-1 border rounded-md cursor-pointer transition-colors ${
                          isMarked ? 'bg-destructive/10 border-destructive' : 'bg-card hover:bg-muted'
                        }`}
                        onClick={() => toggleUnfollow('team', team.id)}
                      >
                        {team.logo_url && (
                          <img src={team.logo_url} alt="" className="h-5 w-5 object-contain" />
                        )}
                        <span className="text-sm font-medium">{team.display_name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* People Section */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Players & Coaches</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              {selectedPeople.length === 0 ? (
                <p className="text-muted-foreground text-sm">No players or coaches selected</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedPeople.map((person) => {
                    const key = `person-${person.id}`;
                    const isMarked = toUnfollow.has(key);
                    const context = [];
                    if (person.teams?.display_name) context.push(person.teams.display_name);
                    if (person.leagues?.code) context.push(person.leagues.code);
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-2 px-2 py-1 border rounded-md cursor-pointer transition-colors ${
                          isMarked ? 'bg-destructive/10 border-destructive' : 'bg-card hover:bg-muted'
                        }`}
                        onClick={() => toggleUnfollow('person', person.id)}
                      >
                        <span className="text-sm font-medium">{person.name}</span>
                        {context.length > 0 && (
                          <span className="text-xs text-muted-foreground">({context.join(" • ")})</span>
                        )}
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
