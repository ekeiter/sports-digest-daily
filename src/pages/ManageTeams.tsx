import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const TEAMS_BY_LEAGUE = {
  MLB: [
    "Arizona Diamondbacks", "Atlanta Braves", "Baltimore Orioles", "Boston Red Sox", 
    "Chicago Cubs", "Chicago White Sox", "Cincinnati Reds", "Cleveland Guardians",
    "Colorado Rockies", "Detroit Tigers", "Houston Astros", "Kansas City Royals",
    "Los Angeles Angels", "Los Angeles Dodgers", "Miami Marlins", "Milwaukee Brewers",
    "Minnesota Twins", "New York Mets", "New York Yankees", "Oakland Athletics",
    "Philadelphia Phillies", "Pittsburgh Pirates", "San Diego Padres", "San Francisco Giants",
    "Seattle Mariners", "St. Louis Cardinals", "Tampa Bay Rays", "Texas Rangers",
    "Toronto Blue Jays", "Washington Nationals"
  ],
  NFL: [
    "Arizona Cardinals", "Atlanta Falcons", "Baltimore Ravens", "Buffalo Bills",
    "Carolina Panthers", "Chicago Bears", "Cincinnati Bengals", "Cleveland Browns",
    "Dallas Cowboys", "Denver Broncos", "Detroit Lions", "Green Bay Packers",
    "Houston Texans", "Indianapolis Colts", "Jacksonville Jaguars", "Kansas City Chiefs",
    "Las Vegas Raiders", "Los Angeles Chargers", "Los Angeles Rams", "Miami Dolphins",
    "Minnesota Vikings", "New England Patriots", "New Orleans Saints", "New York Giants",
    "New York Jets", "Philadelphia Eagles", "Pittsburgh Steelers", "San Francisco 49ers",
    "Seattle Seahawks", "Tampa Bay Buccaneers", "Tennessee Titans", "Washington Commanders"
  ],
  NBA: [
    "Atlanta Hawks", "Boston Celtics", "Brooklyn Nets", "Charlotte Hornets",
    "Chicago Bulls", "Cleveland Cavaliers", "Dallas Mavericks", "Denver Nuggets",
    "Detroit Pistons", "Golden State Warriors", "Houston Rockets", "Indiana Pacers",
    "Los Angeles Clippers", "Los Angeles Lakers", "Memphis Grizzlies", "Miami Heat",
    "Milwaukee Bucks", "Minnesota Timberwolves", "New Orleans Pelicans", "New York Knicks",
    "Oklahoma City Thunder", "Orlando Magic", "Philadelphia 76ers", "Phoenix Suns",
    "Portland Trail Blazers", "Sacramento Kings", "San Antonio Spurs", "Toronto Raptors",
    "Utah Jazz", "Washington Wizards"
  ],
  NHL: [
    "Anaheim Ducks", "Arizona Coyotes", "Boston Bruins", "Buffalo Sabres",
    "Calgary Flames", "Carolina Hurricanes", "Chicago Blackhawks", "Colorado Avalanche",
    "Columbus Blue Jackets", "Dallas Stars", "Detroit Red Wings", "Edmonton Oilers",
    "Florida Panthers", "Los Angeles Kings", "Minnesota Wild", "Montreal Canadiens",
    "Nashville Predators", "New Jersey Devils", "New York Islanders", "New York Rangers",
    "Ottawa Senators", "Philadelphia Flyers", "Pittsburgh Penguins", "San Jose Sharks",
    "Seattle Kraken", "St. Louis Blues", "Tampa Bay Lightning", "Toronto Maple Leafs",
    "Vancouver Canucks", "Vegas Golden Knights", "Washington Capitals", "Winnipeg Jets"
  ]
};

const ManageTeams = () => {
  const [selectedTeams, setSelectedTeams] = useState<Array<{id: string, team_name: string, league: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadUserTeams();
  }, []);

  const loadUserTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('user_teams')
        .select('*')
        .eq('user_id', '00000000-0000-0000-0000-000000000000') // Test UUID
        .order('league, team_name');

      if (error) throw error;
      setSelectedTeams(data || []);
    } catch (error) {
      console.error('Error loading teams:', error);
      toast({
        title: "Error",
        description: "Failed to load your teams",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTeam = async (league: string, teamName: string) => {
    const existingTeam = selectedTeams.find(t => t.team_name === teamName && t.league === league);
    
    if (existingTeam) {
      // Remove team
      try {
        const { error } = await supabase
          .from('user_teams')
          .delete()
          .eq('id', existingTeam.id);

        if (error) throw error;
        
        setSelectedTeams(prev => prev.filter(t => t.id !== existingTeam.id));
        toast({
          title: "Team removed",
          description: `${teamName} has been removed from your teams`,
        });
      } catch (error) {
        console.error('Error removing team:', error);
        toast({
          title: "Error",
          description: "Failed to remove team",
          variant: "destructive",
        });
      }
    } else {
      // Add team
      try {
        const { data, error } = await supabase
          .from('user_teams')
          .insert({
            league,
            team_name: teamName,
            user_id: '00000000-0000-0000-0000-000000000000' // Test UUID
          })
          .select()
          .single();

        if (error) throw error;
        
        setSelectedTeams(prev => [...prev, data]);
        toast({
          title: "Team added",
          description: `${teamName} has been added to your teams`,
        });
      } catch (error: any) {
        console.error('Error adding team:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        toast({
          title: "Error",
          description: `Failed to add team: ${error.message || 'Unknown error'}`,
          variant: "destructive",
        });
      }
    }
  };

  const isTeamSelected = (league: string, teamName: string) => {
    return selectedTeams.some(t => t.team_name === teamName && t.league === league);
  };

  const clearAllTeams = async () => {
    if (selectedTeams.length === 0) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_teams')
        .delete()
        .eq('user_id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
      
      setSelectedTeams([]);
      toast({
        title: "Teams cleared",
        description: "All teams have been removed from your selections",
      });
    } catch (error) {
      console.error('Error clearing teams:', error);
      toast({
        title: "Error",
        description: "Failed to clear teams",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading your teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/news')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Manage Teams</h1>
          <div className="ml-auto flex items-center gap-3">
            {selectedTeams.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAllTeams}
                disabled={saving}
              >
                Clear All
              </Button>
            )}
            <Badge variant="secondary">
              {selectedTeams.length} team{selectedTeams.length !== 1 ? 's' : ''} selected
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {Object.entries(TEAMS_BY_LEAGUE).map(([league, teams]) => (
            <Card key={league}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {league}
                  <Badge variant="outline">
                    {selectedTeams.filter(t => t.league === league).length} selected
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {teams.map((team) => {
                    const isSelected = isTeamSelected(league, team);
                    return (
                      <Button
                        key={team}
                        variant={isSelected ? "default" : "outline"}
                        className="justify-start h-auto p-3 text-left"
                        onClick={() => toggleTeam(league, team)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm">{team}</span>
                          {isSelected ? (
                            <X className="h-3 w-3 ml-2 flex-shrink-0" />
                          ) : (
                            <Plus className="h-3 w-3 ml-2 flex-shrink-0" />
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ManageTeams;