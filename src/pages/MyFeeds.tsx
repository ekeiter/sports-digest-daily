import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import mlbLogo from "@/assets/mlb-logo.svg";
import nflLogo from "@/assets/nfl-logo.png";
import nbaLogo from "@/assets/nba-logo.png";
import nhlLogo from "@/assets/nhl-logo.png";
import wnbaLogo from "@/assets/wnba-logo.png";
import ncaafLogo from "@/assets/ncaaf-logo.svg";
import ncaamLogo from "@/assets/ncaam-logo.png";
import mlsLogo from "@/assets/mls-logo.png";
import { teamLogos } from "@/lib/teamLogos";

interface Topic {
  id: number;
  name: string;
  code: string;
  sport: string;
}

interface Team {
  id: number;
  display_name: string;
  slug: string;
  city_state_name: string;
}

export default function MyFeeds() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([]);

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
      // Fetch selected topics
      const { data: topicInterests } = await supabase
        .from("subscriber_interests")
        .select("subject_id")
        .eq("subscriber_id", userId)
        .eq("kind", "topic");

      if (topicInterests && topicInterests.length > 0) {
        const topicIds = topicInterests.map(t => t.subject_id);
        const { data: topics } = await supabase
          .from("topics")
          .select("id, name, code, sport")
          .in("id", topicIds);
        
        if (topics) setSelectedTopics(topics);
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
          .select("id, display_name, slug, city_state_name")
          .in("id", teamIds);
        
        if (teams) setSelectedTeams(teams);
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
          <h1 className="text-2xl font-bold text-center">My Current Feeds</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
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
                  {selectedTopics.map((topic) => {
                    const isMLB = topic.name.toLowerCase().includes('major league baseball');
                    const isNFL = topic.name.toLowerCase().includes('national football league');
                    const isNBA = topic.name.toLowerCase().includes('national basketball association') && !topic.name.toLowerCase().includes('women');
                    const isNHL = topic.name.toLowerCase().includes('national hockey league');
                    const isWNBA = topic.name.toLowerCase().includes('women') && topic.name.toLowerCase().includes('national basketball association');
                    const isNCAAF = topic.name.toLowerCase().includes('college football');
                    const isNCAAM = topic.id === 10;
                    const isMLS = topic.name.toLowerCase().includes('major league soccer');
                    
                    let displayName = topic.name;
                    if (isMLB) displayName = 'MLB';
                    else if (isNFL) displayName = 'NFL';
                    else if (isNBA) displayName = 'NBA';
                    else if (isNHL) displayName = 'NHL';
                    else if (isWNBA) displayName = 'WNBA';
                    else if (isNCAAF) displayName = 'NCAAF';
                    else if (isNCAAM) displayName = 'NCAAM';
                    else if (isMLS) displayName = 'MLS';

                    return (
                      <div
                        key={topic.id}
                        className="p-3 border rounded-lg bg-card flex items-center gap-3"
                      >
                        {(isMLB || isNFL || isNBA || isNHL || isWNBA || isNCAAF || isNCAAM || isMLS) && (
                          <div className="flex items-center justify-center w-12 h-12 flex-shrink-0">
                            {isMLB && <img src={mlbLogo} alt="MLB" className="h-10 w-10 object-contain" />}
                            {isNFL && <img src={nflLogo} alt="NFL" className="h-12 w-12 object-contain" />}
                            {isNBA && <img src={nbaLogo} alt="NBA" className="h-10 w-10 object-contain" />}
                            {isNHL && <img src={nhlLogo} alt="NHL" className="h-10 w-10 object-contain" />}
                            {isWNBA && <img src={wnbaLogo} alt="WNBA" className="h-10 w-10 object-contain" />}
                            {isNCAAF && <img src={ncaafLogo} alt="NCAAF" className="h-10 w-10 object-contain" />}
                            {isNCAAM && <img src={ncaamLogo} alt="NCAAM" className="h-10 w-10 object-contain" />}
                            {isMLS && <img src={mlsLogo} alt="MLS" className="h-10 w-10 object-contain" />}
                          </div>
                        )}
                        <div className="font-semibold">{displayName}</div>
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
                    const logoUrl = teamLogos[team.slug];
                    const [logoError, setLogoError] = useState(false);
                    const getInitials = (name: string) => {
                      return name
                        .split(' ')
                        .filter(word => word.length > 0)
                        .map(word => word[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 3);
                    };
                    
                    return (
                      <div
                        key={team.id}
                        className="p-3 border rounded-lg bg-card flex items-center gap-3"
                      >
                        <div className="flex items-center justify-center w-12 h-12 flex-shrink-0 bg-muted rounded-lg">
                          {logoUrl && !logoError ? (
                            <img 
                              src={logoUrl} 
                              alt={team.display_name}
                              className="h-10 w-10 object-contain"
                              onError={() => setLogoError(true)}
                            />
                          ) : (
                            <span className="text-xs font-bold text-muted-foreground">
                              {getInitials(team.display_name)}
                            </span>
                          )}
                        </div>
                        <div className="font-semibold">{team.display_name}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate("/")}>
              Return to Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate("/preferences")}>
              Manage Feed Preferences
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
