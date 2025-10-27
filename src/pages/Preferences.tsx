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
import arizonaDiamondbacksLogo from "@/assets/team-logos/arizona-diamondbacks.svg";
import atlantaBravesLogo from "@/assets/team-logos/atlanta-braves.svg";
import baltimoreOriolesLogo from "@/assets/team-logos/baltimore-orioles.svg";
import bostonRedSoxLogo from "@/assets/team-logos/boston-red-sox.svg";
import chicagoCubsLogo from "@/assets/team-logos/chicago-cubs.svg";
import chicagoWhiteSoxLogo from "@/assets/team-logos/chicago-white-sox.svg";
import cincinnatiRedsLogo from "@/assets/team-logos/cincinnati-reds.svg";
import clevelandGuardiansLogo from "@/assets/team-logos/cleveland-guardians.svg";
import coloradoRockiesLogo from "@/assets/team-logos/colorado-rockies.svg";
import detroitTigersLogo from "@/assets/team-logos/detroit-tigers.svg";
import houstonAstrosLogo from "@/assets/team-logos/houston-astros.svg";
import kansasCityRoyalsLogo from "@/assets/team-logos/kansas-city-royals.svg";
import losAngelesAngelsLogo from "@/assets/team-logos/los-angeles-angels.svg";
import losAngelesDodgersLogo from "@/assets/team-logos/los-angeles-dodgers.svg";
import miamiMarlinsLogo from "@/assets/team-logos/miami-marlins.svg";
import milwaukeeBrewersLogo from "@/assets/team-logos/milwaukee-brewers.svg";
import minnesotaTwinsLogo from "@/assets/team-logos/minnesota-twins.svg";
import newYorkMetsLogo from "@/assets/team-logos/new-york-mets.svg";
import newYorkYankeesLogo from "@/assets/team-logos/new-york-yankees.svg";
import oaklandAthleticsLogo from "@/assets/team-logos/oakland-athletics.svg";
import philadelphiaPhilliesLogo from "@/assets/team-logos/philadelphia-phillies.svg";
import pittsburghPiratesLogo from "@/assets/team-logos/pittsburgh-pirates.svg";
import sanDiegoPadresLogo from "@/assets/team-logos/san-diego-padres.svg";
import sanFranciscoGiantsLogo from "@/assets/team-logos/san-francisco-giants.svg";
import seattleMarinersLogo from "@/assets/team-logos/seattle-mariners.svg";
import stLouisCardinalsLogo from "@/assets/team-logos/st-louis-cardinals.svg";
import tampaBayRaysLogo from "@/assets/team-logos/tampa-bay-rays.svg";
import texasRangersLogo from "@/assets/team-logos/texas-rangers.svg";
import torontoBlueJaysLogo from "@/assets/team-logos/toronto-blue-jays.svg";
import washingtonNationalsLogo from "@/assets/team-logos/washington-nationals.svg";

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


const mlbTeamLogos: Record<string, string> = {
  "Arizona Diamondbacks": arizonaDiamondbacksLogo,
  "Atlanta Braves": atlantaBravesLogo,
  "Baltimore Orioles": baltimoreOriolesLogo,
  "Boston Red Sox": bostonRedSoxLogo,
  "Chicago Cubs": chicagoCubsLogo,
  "Chicago White Sox": chicagoWhiteSoxLogo,
  "Cincinnati Reds": cincinnatiRedsLogo,
  "Cleveland Guardians": clevelandGuardiansLogo,
  "Colorado Rockies": coloradoRockiesLogo,
  "Detroit Tigers": detroitTigersLogo,
  "Houston Astros": houstonAstrosLogo,
  "Kansas City Royals": kansasCityRoyalsLogo,
  "Los Angeles Angels": losAngelesAngelsLogo,
  "Los Angeles Dodgers": losAngelesDodgersLogo,
  "Miami Marlins": miamiMarlinsLogo,
  "Milwaukee Brewers": milwaukeeBrewersLogo,
  "Minnesota Twins": minnesotaTwinsLogo,
  "New York Mets": newYorkMetsLogo,
  "New York Yankees": newYorkYankeesLogo,
  "Oakland Athletics": oaklandAthleticsLogo,
  "Philadelphia Phillies": philadelphiaPhilliesLogo,
  "Pittsburgh Pirates": pittsburghPiratesLogo,
  "San Diego Padres": sanDiegoPadresLogo,
  "San Francisco Giants": sanFranciscoGiantsLogo,
  "Seattle Mariners": seattleMarinersLogo,
  "St. Louis Cardinals": stLouisCardinalsLogo,
  "Tampa Bay Rays": tampaBayRaysLogo,
  "Texas Rangers": texasRangersLogo,
  "Toronto Blue Jays": torontoBlueJaysLogo,
  "Washington Nationals": washingtonNationalsLogo,
};

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

  // Sort the groups to ensure MLB is first, NFL is second, and "other sports" appears last
  const sortedGroupEntries = Object.entries(groupedTopics).sort(([keyA], [keyB]) => {
    const aIsBaseball = keyA.toLowerCase().includes('baseball');
    const bIsBaseball = keyB.toLowerCase().includes('baseball');
    const aIsFootball = keyA.toLowerCase().includes('pro football');
    const bIsFootball = keyB.toLowerCase().includes('pro football');
    
    if (aIsBaseball) return -1;
    if (bIsBaseball) return 1;
    if (aIsFootball) return -1;
    if (bIsFootball) return 1;
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
                  {(sportTopics.length > 1 || sport === 'other sports') && (
                    <h3 className="text-lg font-semibold capitalize">{sport}</h3>
                  )}
                  
                  {sportTopics.map(topic => {
                    const topicTeams = getTeamsForTopic(topic.id);
                    const hasTeams = topic.kind === 'league' || topicTeams.length > 0;
                    const isExpanded = expandedTopics.includes(topic.id);
                    
                    const isMLB = topic.name.toLowerCase().includes('major league baseball');
                    const isNFL = topic.name.toLowerCase().includes('national football league');
                    const displayName = isMLB ? 'MLB' : isNFL ? 'NFL' : topic.name;
                    
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
                              <img src={nflLogo} alt="NFL" className="h-12 w-12 object-contain" />
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
                                const teamLogo = mlbTeamLogos[team.display_name];
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
                                      <img src={teamLogo} alt={team.display_name} className="h-6 w-6 object-contain" />
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
