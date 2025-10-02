import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, X, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Function to get team logo URL
const getTeamLogo = (teamName: string, league: string): string => {
  // Create a mapping for team abbreviations/codes for better logo URLs
  const teamMappings: { [key: string]: { [team: string]: string } } = {
    MLB: {
      "Arizona Diamondbacks": "ari",
      "Atlanta Braves": "atl", 
      "Baltimore Orioles": "bal",
      "Boston Red Sox": "bos",
      "Chicago Cubs": "chc",
      "Chicago White Sox": "cws",
      "Cincinnati Reds": "cin",
      "Cleveland Guardians": "cle",
      "Colorado Rockies": "col",
      "Detroit Tigers": "det",
      "Houston Astros": "hou",
      "Kansas City Royals": "kc",
      "Los Angeles Angels": "laa",
      "Los Angeles Dodgers": "lad",
      "Miami Marlins": "mia",
      "Milwaukee Brewers": "mil",
      "Minnesota Twins": "min",
      "New York Mets": "nym",
      "New York Yankees": "nyy",
      "Oakland Athletics": "oak",
      "Philadelphia Phillies": "phi",
      "Pittsburgh Pirates": "pit",
      "San Diego Padres": "sd",
      "San Francisco Giants": "sf",
      "Seattle Mariners": "sea",
      "St. Louis Cardinals": "stl",
      "Tampa Bay Rays": "tb",
      "Texas Rangers": "tex",
      "Toronto Blue Jays": "tor",
      "Washington Nationals": "wsh"
    },
    NFL: {
      "Arizona Cardinals": "ari",
      "Atlanta Falcons": "atl",
      "Baltimore Ravens": "bal",
      "Buffalo Bills": "buf",
      "Carolina Panthers": "car",
      "Chicago Bears": "chi",
      "Cincinnati Bengals": "cin",
      "Cleveland Browns": "cle",
      "Dallas Cowboys": "dal",
      "Denver Broncos": "den",
      "Detroit Lions": "det",
      "Green Bay Packers": "gb",
      "Houston Texans": "hou",
      "Indianapolis Colts": "ind",
      "Jacksonville Jaguars": "jax",
      "Kansas City Chiefs": "kc",
      "Las Vegas Raiders": "lv",
      "Los Angeles Chargers": "lac",
      "Los Angeles Rams": "lar",
      "Miami Dolphins": "mia",
      "Minnesota Vikings": "min",
      "New England Patriots": "ne",
      "New Orleans Saints": "no",
      "New York Giants": "nyg",
      "New York Jets": "nyj",
      "Philadelphia Eagles": "phi",
      "Pittsburgh Steelers": "pit",
      "San Francisco 49ers": "sf",
      "Seattle Seahawks": "sea",
      "Tampa Bay Buccaneers": "tb",
      "Tennessee Titans": "ten",
      "Washington Commanders": "wsh"
    },
    NBA: {
      "Atlanta Hawks": "atl",
      "Boston Celtics": "bos",
      "Brooklyn Nets": "bkn",
      "Charlotte Hornets": "cha",
      "Chicago Bulls": "chi",
      "Cleveland Cavaliers": "cle",
      "Dallas Mavericks": "dal",
      "Denver Nuggets": "den",
      "Detroit Pistons": "det",
      "Golden State Warriors": "gsw",
      "Houston Rockets": "hou",
      "Indiana Pacers": "ind",
      "Los Angeles Clippers": "lac",
      "Los Angeles Lakers": "lal",
      "Memphis Grizzlies": "mem",
      "Miami Heat": "mia",
      "Milwaukee Bucks": "mil",
      "Minnesota Timberwolves": "min",
      "New Orleans Pelicans": "no",
      "New York Knicks": "nyk",
      "Oklahoma City Thunder": "okc",
      "Orlando Magic": "orl",
      "Philadelphia 76ers": "phi",
      "Phoenix Suns": "phx",
      "Portland Trail Blazers": "por",
      "Sacramento Kings": "sac",
      "San Antonio Spurs": "sa",
      "Toronto Raptors": "tor",
      "Utah Jazz": "utah",
      "Washington Wizards": "wsh"
    },
    NHL: {
      "Anaheim Ducks": "ana",
      "Arizona Coyotes": "ari", // Keep old mapping for existing data
      "Utah Mammoth": "uta",
      "Boston Bruins": "bos",
      "Buffalo Sabres": "buf",
      "Calgary Flames": "cgy",
      "Carolina Hurricanes": "car",
      "Chicago Blackhawks": "chi",
      "Colorado Avalanche": "col",
      "Columbus Blue Jackets": "cbj",
      "Dallas Stars": "dal",
      "Detroit Red Wings": "det",
      "Edmonton Oilers": "edm",
      "Florida Panthers": "fla",
      "Los Angeles Kings": "lak",
      "Minnesota Wild": "min",
      "Montreal Canadiens": "mtl",
      "Nashville Predators": "nsh",
      "New Jersey Devils": "njd",
      "New York Islanders": "nyi",
      "New York Rangers": "nyr",
      "Ottawa Senators": "ott",
      "Philadelphia Flyers": "phi",
      "Pittsburgh Penguins": "pit",
      "San Jose Sharks": "sj",
      "Seattle Kraken": "sea",
      "St. Louis Blues": "stl",
      "Tampa Bay Lightning": "tb",
      "Toronto Maple Leafs": "tor",
      "Vancouver Canucks": "van",
      "Vegas Golden Knights": "vgk",
      "Washington Capitals": "wsh",
      "Winnipeg Jets": "wpg"
    }
  };

  const teamCode = teamMappings[league]?.[teamName];
  if (!teamCode) {
    console.log(`No team code found for ${teamName} in ${league}`);
    return "";
  }

  // Using ESPN's logo API with proper team codes
  return `https://a.espncdn.com/i/teamlogos/${league.toLowerCase()}/500/${teamCode}.png`;
};

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
    "Anaheim Ducks", "Boston Bruins", "Buffalo Sabres", "Calgary Flames",
    "Carolina Hurricanes", "Chicago Blackhawks", "Colorado Avalanche", "Columbus Blue Jackets",
    "Dallas Stars", "Detroit Red Wings", "Edmonton Oilers", "Florida Panthers",
    "Los Angeles Kings", "Minnesota Wild", "Montreal Canadiens", "Nashville Predators",
    "New Jersey Devils", "New York Islanders", "New York Rangers", "Ottawa Senators",
    "Philadelphia Flyers", "Pittsburgh Penguins", "San Jose Sharks", "Seattle Kraken",
    "St. Louis Blues", "Tampa Bay Lightning", "Toronto Maple Leafs", "Utah Mammoth",
    "Vancouver Canucks", "Vegas Golden Knights", "Washington Capitals", "Winnipeg Jets"
  ]
};

const ManageTeams = () => {
  const [selectedTeams, setSelectedTeams] = useState<Array<{id: string, team_name: string, league: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openLeague, setOpenLeague] = useState<string | null>(null);
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
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/news')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold">Manage Teams</h1>
          <div className="ml-auto flex items-center gap-2 md:gap-3">
            {selectedTeams.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAllTeams}
                disabled={saving}
                className="text-xs md:text-sm"
              >
                Clear All
              </Button>
            )}
            <Badge variant="secondary" className="text-xs">
              {selectedTeams.length} team{selectedTeams.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 pb-20">
          {/* Collapsible League Sections */}
          <div className="space-y-4">
            {Object.entries(TEAMS_BY_LEAGUE).map(([league, teams]) => {
              const leagueSelectedTeams = selectedTeams.filter(t => t.league === league);
              
              return (
                <Collapsible 
                  key={league}
                  open={openLeague === league}
                  onOpenChange={(isOpen) => setOpenLeague(isOpen ? league : null)}
                >
                  <Card>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-6 h-auto hover:bg-accent"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-lg font-semibold flex-shrink-0">{league}</span>
                          
                          {/* Selected teams displayed inline */}
                          {leagueSelectedTeams.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                              {leagueSelectedTeams.map((team) => (
                                <Badge 
                                  key={team.id} 
                                  variant="secondary" 
                                  className="flex items-center gap-1.5 py-1 px-2"
                                >
                                  <img 
                                    src={getTeamLogo(team.team_name, team.league)}
                                    alt={`${team.team_name} logo`}
                                    className="w-4 h-4 object-contain"
                                    onError={(e) => e.currentTarget.style.display = 'none'}
                                  />
                                  <span className="text-xs truncate max-w-[120px]">{team.team_name}</span>
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              No teams selected
                            </Badge>
                          )}
                        </div>
                        
                        <ChevronDown 
                          className={`h-5 w-5 flex-shrink-0 ml-2 transition-transform duration-200 ${
                            openLeague === league ? 'transform rotate-180' : ''
                          }`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        {/* All Teams Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                          {teams.map((team) => {
                            const isSelected = isTeamSelected(league, team);
                            return (
                              <Button
                                key={team}
                                variant={isSelected ? "default" : "outline"}
                                className="justify-start h-14 py-2 px-2 text-left w-full"
                                onClick={() => toggleTeam(league, team)}
                              >
                                <div className="flex items-center justify-between w-full min-w-0">
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <img 
                                      src={getTeamLogo(team, league)}
                                      alt={`${team} logo`}
                                      className="w-5 h-5 object-contain flex-shrink-0"
                                      onError={(e) => {
                                        console.log(`Failed to load logo for ${team}`);
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                    <span className="text-xs truncate">{team}</span>
                                  </div>
                                  {isSelected ? (
                                    <X className="h-3.5 w-3.5 ml-1 flex-shrink-0" />
                                  ) : (
                                    <Plus className="h-3.5 w-3.5 ml-1 flex-shrink-0" />
                                  )}
                                </div>
                              </Button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 safe-area-pb">
        <div className="container mx-auto">
          <Button 
            onClick={() => navigate('/news')} 
            className="w-full"
            size="lg"
          >
            Continue to News
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ManageTeams;
