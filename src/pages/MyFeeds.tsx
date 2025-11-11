import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type League = Database['public']['Tables']['leagues']['Row'];
type Team = Database['public']['Tables']['teams']['Row'];
type Sport = Database['public']['Tables']['sports']['Row'];

export default function MyFeeds() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedLeagues, setSelectedLeagues] = useState<League[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([]);
  const [selectedSports, setSelectedSports] = useState<Sport[]>([]);
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
    } catch (error) {
      console.error("Error loading feeds:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUnfollow = (kind: 'sport' | 'league' | 'team', id: number) => {
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
          p_subscriber_id: user.id,
          p_subject_id: subjectId,
          p_kind: kind as 'sport' | 'league' | 'team'
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl md:text-2xl font-bold text-center">My Current Feeds</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Sports Section */}
          <Card>
            <CardHeader>
              <CardTitle>Sports</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSports.length === 0 ? (
                <p className="text-muted-foreground">No sports selected</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedSports.map((sport) => {
                    const key = `sport-${sport.id}`;
                    const isChecked = toUnfollow.has(key);
                    return (
                      <div
                        key={sport.id}
                        className="p-3 border rounded-lg bg-card flex items-center gap-3"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleUnfollow('sport', sport.id)}
                        />
                        <div className="font-semibold">{sport.display_name}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leagues Section */}
          <Card>
            <CardHeader>
              <CardTitle>Leagues</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedLeagues.length === 0 ? (
                <p className="text-muted-foreground">No leagues selected</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedLeagues.map((league) => {
                    const key = `league-${league.id}`;
                    const isChecked = toUnfollow.has(key);
                    return (
                      <div
                        key={league.id}
                        className="p-3 border rounded-lg bg-card flex items-center gap-3"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleUnfollow('league', league.id)}
                        />
                        {league.logo_url && (
                          <div className="flex items-center justify-center w-12 h-12 flex-shrink-0">
                            <img 
                              src={league.logo_url} 
                              alt={league.name}
                              className="h-10 w-10 object-contain" 
                            />
                          </div>
                        )}
                        <div className="font-semibold">{league.code || league.name}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Teams Section */}
          <Card>
            <CardHeader>
              <CardTitle>Teams</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTeams.length === 0 ? (
                <p className="text-muted-foreground">No teams selected</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedTeams.map((team) => {
                    const key = `team-${team.id}`;
                    const isChecked = toUnfollow.has(key);
                    return (
                      <div
                        key={team.id}
                        className="p-3 border rounded-lg bg-card flex items-center gap-3"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleUnfollow('team', team.id)}
                        />
                        {team.logo_url && (
                          <div className="flex items-center justify-center w-12 h-12 flex-shrink-0">
                            <img 
                              src={team.logo_url} 
                              alt={team.display_name}
                              className="h-10 w-10 object-contain"
                            />
                          </div>
                        )}
                        <div className="font-semibold">{team.display_name}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 max-w-md mx-auto w-full">
            {toUnfollow.size > 0 && (
              <Button 
                className="w-full" 
                onClick={handleSaveChanges}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  "Save Changes & Exit"
                )}
              </Button>
            )}
            <Button className="w-full" variant="outline" onClick={() => navigate("/")}>
              Return to Dashboard
            </Button>
            <Button className="w-full" variant="outline" onClick={() => navigate("/preferences")}>
              Manage Feed Preferences
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
