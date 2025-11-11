import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface League {
  id: number;
  name: string;
  code: string;
  sport: string;
  logo_url?: string;
}

interface Team {
  id: number;
  display_name: string;
  slug: string;
  city_state_name: string;
  logo_url?: string;
}

import type { Tables } from "@/integrations/supabase/types";

type Sport = Tables<"sports">;

export default function MyFeeds() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedLeagues, setSelectedLeagues] = useState<League[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([]);
  const [selectedSports, setSelectedSports] = useState<Sport[]>([]);

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
          .select("id, name, code, sport, logo_url")
          .in("id", leagueIds);
        
        if (leagues) setSelectedLeagues(leagues as unknown as League[]);
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
          .select("id, display_name, slug, city_state_name, logo_url")
          .in("id", teamIds);
        
        if (teams) setSelectedTeams(teams as unknown as Team[]);
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
          .select("id, display_name, sport, description")
          .in("id", sportIds);
        
        if (sports) setSelectedSports(sports as unknown as Sport[]);
      }
    } catch (error) {
      console.error("Error loading feeds:", error);
    } finally {
      setLoading(false);
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
                  {selectedSports.map((sport) => (
                    <div
                      key={sport.id}
                      className="p-3 border rounded-lg bg-card flex items-center gap-3"
                    >
                      <div className="font-semibold">{sport.display_name}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leagues/Topics Section */}
          <Card>
            <CardHeader>
              <CardTitle>Leagues & Topics</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTopics.length === 0 ? (
                <p className="text-muted-foreground">No leagues or topics selected</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedTopics.map((topic) => (
                    <div
                      key={topic.id}
                      className="p-3 border rounded-lg bg-card flex items-center gap-3"
                    >
                      {topic.logo_url && (
                        <div className="flex items-center justify-center w-12 h-12 flex-shrink-0">
                          <img 
                            src={topic.logo_url} 
                            alt={topic.name}
                            className="h-10 w-10 object-contain" 
                          />
                        </div>
                      )}
                      <div className="font-semibold">{topic.code || topic.name}</div>
                    </div>
                  ))}
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
                  {selectedTeams.map((team) => (
                    <div
                      key={team.id}
                      className="p-3 border rounded-lg bg-card flex items-center gap-3"
                    >
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 max-w-md mx-auto w-full">
            <Button className="w-full" onClick={() => navigate("/")}>
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
