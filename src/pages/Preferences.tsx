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

type Topic = Database['public']['Tables']['topics']['Row'] & { logo_url?: string };
type Team = Database['public']['Tables']['teams']['Row'] & { logo_url?: string };
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

      // Load all topics
      const {
        data: topicsData,
        error: topicsError
      } = await supabase.from("topics").select("*").order("sport", {
        ascending: true
      }).order("name", {
        ascending: true
      });
      if (topicsError) throw topicsError;
      setTopics(topicsData as Topic[] || []);

      // Load user's current interests
      const {
        data: interests,
        error: interestsError
      } = await supabase.from("subscriber_interests").select("kind, subject_id").eq("subscriber_id", user.id);
      if (interestsError) throw interestsError;

      // Initialize selected topics and teams from interests
      const topicIds = interests?.filter(i => i.kind === 'topic').map(i => i.subject_id) || [];
      const teamIds = interests?.filter(i => i.kind === 'team').map(i => i.subject_id) || [];
      setSelectedTopics(topicIds);
      setSelectedTeams(teamIds);
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
      const {
        data: teamsData,
        error: teamsError
      } = await supabase.from("teams").select("*").eq("topic_id", topicId).order("display_name", {
        ascending: true
      });
      if (teamsError) throw teamsError;
      setTeams(prev => [...prev, ...(teamsData as Team[] || [])]);
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
  const handleTopicToggle = async (topicId: number) => {
    const topic = topics.find(t => t.id === topicId);
    const label = topic?.code || topic?.name || 'topic';
    try {
      const {
        data: isNowFollowed,
        error
      } = await supabase.rpc('toggle_subscriber_interest' as any, {
        p_kind: 'topic',
        p_subject_id: topicId
      });
      if (error) throw error;

      // Optimistic update
      if (isNowFollowed) {
        setSelectedTopics(prev => [...prev, topicId]);
        toast.success(`Followed ${label}`);
      } else {
        setSelectedTopics(prev => prev.filter(id => id !== topicId));
        toast(`Unfollowed ${label}`);
      }
    } catch (error) {
      console.error("Error toggling topic:", error);
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
  const toggleTopicExpansion = async (topicId: number) => {
    const willExpand = !expandedTopics.includes(topicId);
    setExpandedTopics(prev => prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]);
    if (willExpand) {
      await loadTeamsForTopic(topicId);
    }
  };
  const getTeamsForTopic = (topicId: number) => {
    return teams.filter(team => team.topic_id === topicId);
  };
  const otherTopicsList = ['archery', 'badminton', 'beach volleyball', 'canoe and kayak', 'competitive eating', 'darts', 'diving', 'equestrian', 'fencing', 'field hockey', 'figure skating', 'gymnastics', 'handball', 'judo', 'modern pentathlon', 'pickleball', 'poker', 'rodeo', 'rowing', 'sailing', 'shooting', 'skateboarding', 'skiing and snowboarding', 'surfing', 'swimming', 'table tennis', 'triathlon', 'water polo', 'weightlifting'];
  const groupedTopics = topics.reduce((acc, topic) => {
    // Extract NFL to be standalone
    if (topic.name.toLowerCase().includes('national football league')) {
      if (!acc['nfl-standalone']) {
        acc['nfl-standalone'] = [];
      }
      acc['nfl-standalone'].push(topic);
      return acc;
    }

    // Extract NBA to be standalone (but not WNBA)
    if (topic.name.toLowerCase().includes('national basketball association') && !topic.name.toLowerCase().includes('women')) {
      if (!acc['nba-standalone']) {
        acc['nba-standalone'] = [];
      }
      acc['nba-standalone'].push(topic);
      return acc;
    }

    // Extract NHL to be standalone
    if (topic.name.toLowerCase().includes('national hockey league')) {
      if (!acc['nhl-standalone']) {
        acc['nhl-standalone'] = [];
      }
      acc['nhl-standalone'].push(topic);
      return acc;
    }
    const isOtherTopic = otherTopicsList.some(other => topic.sport.toLowerCase().includes(other.toLowerCase()));
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

  // Sort the groups: MLB, NFL, NBA, NHL, WNBA, College Football, Men's CBB, Women's CBB, PGA, LPGA, LIV Golf, Soccer, College Football - FCS, College Baseball, then others
  const sortedGroupEntries = Object.entries(groupedTopics).sort(([keyA], [keyB]) => {
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

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-2xl">Customize Your Sports Feed</CardTitle>
              <CardDescription>
                Your feed will be personalized based on your topic and team selections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sortedGroupEntries.map(([sport, sportTopics]) => <div key={sport} className="space-y-2">
                  {sport !== 'nfl-standalone' && sport !== 'nba-standalone' && sport !== 'nhl-standalone' && !sport.toLowerCase().includes('college football') && !sport.toLowerCase().includes('college basketball') && (sportTopics.length > 1 || sport === 'other sports') && <h3 className="text-lg font-semibold capitalize">{sport}</h3>}
                  
                  {sportTopics.map((topic, index) => {
                const topicTeams = getTeamsForTopic(topic.id);
                const hasTeams = topic.kind === 'league' || topicTeams.length > 0;
                const isExpanded = expandedTopics.includes(topic.id);
                const isMLB = topic.name.toLowerCase().includes('major league baseball');
                const isNFL = topic.name.toLowerCase().includes('national football league');
                const isNBA = topic.name.toLowerCase().includes('national basketball association') && !topic.name.toLowerCase().includes('women');
                const isNHL = topic.name.toLowerCase().includes('national hockey league');
                const isWNBA = topic.name.toLowerCase().includes('women') && topic.name.toLowerCase().includes('national basketball association');
                const isNCAAF = topic.name.toLowerCase().includes('college football');
                const isNCAAM = topic.id === 10; // Men's College Basketball
                const isNCAAW = topic.id === 29; // Women's College Basketball

                // For college football, use index to differentiate FBS (0) and FCS (1)
                let displayName = topic.name;
                if (isMLB) displayName = 'MLB';else if (isNFL) displayName = 'NFL';else if (isNBA) displayName = 'NBA';else if (isNHL) displayName = 'NHL';else if (isWNBA) displayName = 'WNBA';else if (isNCAAM) displayName = 'NCAAM';else if (isNCAAW) displayName = 'NCAAW';else if (isNCAAF) {
                  const ncaafTopics = sportTopics.filter(t => t.name.toLowerCase().includes('college football'));
                  const ncaafIndex = ncaafTopics.findIndex(t => t.id === topic.id);
                  displayName = ncaafIndex === 0 ? 'NCAAF' : 'NCAAF - FCS';
                }
                return <div key={topic.id} className="space-y-2">
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                          <Checkbox id={`topic-${topic.id}`} checked={selectedTopics.includes(topic.id)} onCheckedChange={() => handleTopicToggle(topic.id)} />
                          {topic.logo_url && <div className="flex items-center justify-center w-12 h-12 shrink-0">
                              <img src={topic.logo_url} alt={displayName} className="h-10 w-10 object-contain" />
                            </div>}
                          <label htmlFor={`topic-${topic.id}`} className="font-medium cursor-pointer flex-1 min-w-0">
                            {displayName}
                          </label>
                          {hasTeams && <Button variant="outline" size="sm" onClick={() => toggleTopicExpansion(topic.id)} className="shrink-0">
                              Teams
                            </Button>}
                        </div>

                        {hasTeams && isExpanded && <div className="ml-8 space-y-2 p-4 bg-muted/30 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {topicTeams.map(team => {
                        return <div key={team.id} className="flex items-center gap-2 p-2 rounded hover:bg-background transition-colors">
                                    <Checkbox id={`team-${team.id}`} checked={selectedTeams.includes(team.id)} onCheckedChange={() => handleTeamToggle(team.id)} />
                                    {team.logo_url && <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
                                        <img src={team.logo_url} alt={team.display_name} className="h-8 w-8 object-contain" />
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

          <div className="text-sm text-muted-foreground text-center">
            {selectedTopics.length} topics, {selectedTeams.length} teams selected • Changes save automatically
          </div>
        </div>
      </main>
    </div>;
}