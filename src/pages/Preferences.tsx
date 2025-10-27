import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import mlbLogo from "@/assets/mlb-logo.svg";
import nflLogo from "@/assets/nfl-logo.png";
import nbaLogo from "@/assets/nba-logo.png";
import { teamLogos } from "@/lib/teamLogos";

interface Topic {
  id: number;
  code: string;
  name: string;
  kind: string;
  sport: string;
}

interface Team {
  id: number;
  display_name: string;
  slug: string;
  topic_id: number;
  city_state_name: string;
}

export default function Preferences() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [expandedTopics, setExpandedTopics] = useState<number[]>([]);
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
    await loadPreferences();
  };

  const loadPreferences = async () => {
    try {
      setLoading(true);
      
      // Load all topics
      const { data: topicsData, error: topicsError } = await supabase
        .from("topics")
        .select("*")
        .order("sport", { ascending: true })
        .order("name", { ascending: true });

      if (topicsError) throw topicsError;
      setTopics(topicsData || []);

    } catch (error) {
      console.error("Error loading preferences:", error);
      toast.error("Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  const loadTeamsForTopic = async (topicId: number) => {
    if (teams.some(t => t.topic_id === topicId)) {
      return; // Already loaded
    }

    setLoadingTeams(prev => new Set(prev).add(topicId));
    
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("*")
        .eq("topic_id", topicId)
        .order("display_name", { ascending: true });

      if (teamsError) throw teamsError;
      setTeams(prev => [...prev, ...(teamsData || [])]);
    } catch (error) {
      console.error(`Error loading teams for topic ${topicId}:`, error);
      toast.error("Failed to load teams");
    } finally {
      setLoadingTeams(prev => {
        const next = new Set(prev);
        next.delete(topicId);
        return next;
      });
    }
  };

  const handleTopicToggle = (topicId: number) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleTeamToggle = (teamId: number) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const toggleTopicExpansion = async (topicId: number) => {
    const willExpand = !expandedTopics.includes(topicId);
    
    setExpandedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );

    if (willExpand) {
      await loadTeamsForTopic(topicId);
    }
  };

  const getTeamsForTopic = (topicId: number) => {
    return teams.filter(team => team.topic_id === topicId);
  };

  const otherTopicsList = [
    'archery', 'badminton', 'beach volleyball', 'canoe and kayak', 'competitive eating',
    'darts', 'diving', 'equestrian', 'fencing', 'field hockey', 'figure skating',
    'gymnastics', 'handball', 'judo', 'modern pentathlon', 'pickleball', 'poker',
    'rodeo', 'rowing', 'sailing', 'shooting', 'skateboarding', 'skiing and snowboarding',
    'surfing', 'swimming', 'table tennis', 'triathlon', 'water polo', 'weightlifting'
  ];

  const groupedTopics = topics.reduce((acc, topic) => {
    // Extract NFL to be standalone
    if (topic.name.toLowerCase().includes('national football league')) {
      if (!acc['nfl-standalone']) {
        acc['nfl-standalone'] = [];
      }
      acc['nfl-standalone'].push(topic);
      return acc;
    }
    
    // Extract NBA to be standalone
    if (topic.name.toLowerCase().includes('national basketball association')) {
      if (!acc['nba-standalone']) {
        acc['nba-standalone'] = [];
      }
      acc['nba-standalone'].push(topic);
      return acc;
    }
    
    const isOtherTopic = otherTopicsList.some(
      other => topic.sport.toLowerCase().includes(other.toLowerCase())
    );
    
    const groupKey = isOtherTopic ? 'other sports' : topic.sport;
    
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(topic);
    return acc;
  }, {} as Record<string, Topic[]>);

  // Sort "other sports" alphabetically by name
  if (groupedTopics['other sports']) {
    groupedTopics['other sports'].sort((a, b) => a.name.localeCompare(b.name));
  }

  // Sort the groups to ensure MLB is first, NFL standalone is second, NBA is third, College Baseball is fourth, and "other sports" appears last
  const sortedGroupEntries = Object.entries(groupedTopics).sort(([keyA], [keyB]) => {
    const aIsBaseball = keyA.toLowerCase().includes('professional baseball');
    const bIsBaseball = keyB.toLowerCase().includes('professional baseball');
    const aIsNFL = keyA === 'nfl-standalone';
    const bIsNFL = keyB === 'nfl-standalone';
    const aIsNBA = keyA === 'nba-standalone';
    const bIsNBA = keyB === 'nba-standalone';
    const aIsCollegeBaseball = keyA.toLowerCase().includes('college baseball');
    const bIsCollegeBaseball = keyB.toLowerCase().includes('college baseball');
    
    if (aIsBaseball) return -1;
    if (bIsBaseball) return 1;
    if (aIsNFL) return -1;
    if (bIsNFL) return 1;
    if (aIsNBA) return -1;
    if (bIsNBA) return 1;
    if (aIsCollegeBaseball) return -1;
    if (bIsCollegeBaseball) return 1;
    if (keyA === 'other sports') return 1;
    if (keyB === 'other sports') return -1;
    return keyA.localeCompare(keyB);
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
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Feed Preferences</h1>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Customize Your Sports Feed</CardTitle>
              <CardDescription>
                Select the leagues and teams you want to follow. Your feed will be personalized based on your selections.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {sortedGroupEntries.map(([sport, sportTopics]) => (
                <div key={sport} className="space-y-4">
                  {(sportTopics.length > 1 || (sport !== 'nfl-standalone' && sport !== 'nba-standalone' && sport !== 'professional baseball' && sport === 'other sports')) && (
                    <h3 className="text-lg font-semibold capitalize">{sport}</h3>
                  )}
                  
                  {sportTopics.map(topic => {
                    const topicTeams = getTeamsForTopic(topic.id);
                    const hasTeams = topic.kind === 'league' || topicTeams.length > 0;
                    const isExpanded = expandedTopics.includes(topic.id);
                    
                    const isMLB = topic.name.toLowerCase().includes('major league baseball');
                    const isNFL = topic.name.toLowerCase().includes('national football league');
                    const isNBA = topic.name.toLowerCase().includes('national basketball association') && !topic.name.toLowerCase().includes('women');
                    const isWNBA = topic.name.toLowerCase().includes('women') && topic.name.toLowerCase().includes('national basketball association');
                    const displayName = isMLB ? 'MLB' : isNFL ? 'NFL' : isNBA ? 'NBA' : isWNBA ? 'WNBA' : topic.name;
                    
                    return (
                      <div key={topic.id} className="space-y-2">
                        <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <Checkbox
                              id={`topic-${topic.id}`}
                              checked={selectedTopics.includes(topic.id)}
                              onCheckedChange={() => handleTopicToggle(topic.id)}
                            />
                            {isMLB && (
                              <img src={mlbLogo} alt="MLB" className="h-12 w-12 object-contain" />
                            )}
                            {isNFL && (
                              <img src={nflLogo} alt="NFL" className="h-16 w-16 object-contain" />
                            )}
                            {isNBA && (
                              <img src={nbaLogo} alt="NBA" className="h-16 w-16 object-contain" />
                            )}
                            <label
                              htmlFor={`topic-${topic.id}`}
                              className="font-medium cursor-pointer flex-1"
                            >
                              {displayName}
                            </label>
                            {hasTeams && (
                              <Badge variant="secondary" className="text-xs">
                                {topic.kind.replace(/league/gi, '').trim()}
                              </Badge>
                            )}
                          </div>
                          
                          {hasTeams && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTopicExpansion(topic.id)}
                            >
                              {isExpanded ? "Hide Teams" : "Show Teams"}
                            </Button>
                          )}
                        </div>

                        {hasTeams && isExpanded && (
                          <div className="ml-8 space-y-2 p-4 bg-muted/30 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {topicTeams.map(team => {
                                const teamLogo = teamLogos[team.display_name];
                                return (
                                  <div
                                    key={team.id}
                                    className="flex items-center gap-2 p-2 rounded hover:bg-background transition-colors"
                                  >
                                    <Checkbox
                                      id={`team-${team.id}`}
                                      checked={selectedTeams.includes(team.id)}
                                      onCheckedChange={() => handleTeamToggle(team.id)}
                                    />
                                    {teamLogo && (
                                      <img src={teamLogo} alt={team.display_name} className="h-8 w-8 object-contain" />
                                    )}
                                    <label
                                      htmlFor={`team-${team.id}`}
                                      className="text-sm cursor-pointer flex-1"
                                    >
                                      {team.display_name}
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {selectedTopics.length} topics, {selectedTeams.length} teams selected
            </div>
            <Button size="lg" disabled>
              Save Preferences (Coming Soon)
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
