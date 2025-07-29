import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, X, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SPORTS_LIST = [
  "Baseball", "Football", "Basketball", "Hockey", "Soccer", "Tennis", "Golf", 
  "Boxing", "MMA", "Wrestling", "Track and Field", "Swimming", "Gymnastics",
  "Auto Racing", "Formula 1", "Cricket", "Rugby", "Volleyball", "Other"
];

const ManagePlayers = () => {
  const [selectedPlayers, setSelectedPlayers] = useState<Array<{id: string, player_name: string, sport: string}>>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerSport, setNewPlayerSport] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadUserPlayers();
  }, []);

  const loadUserPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_players')
        .select('*')
        .order('sport, player_name');

      if (error) throw error;
      setSelectedPlayers(data || []);
    } catch (error) {
      console.error('Error loading players:', error);
      toast({
        title: "Error",
        description: "Failed to load your players",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addPlayer = async () => {
    if (!newPlayerName.trim() || !newPlayerSport) {
      toast({
        title: "Error",
        description: "Please enter both player name and sport",
        variant: "destructive",
      });
      return;
    }

    setAdding(true);
    try {
      const { data, error } = await supabase
        .from('user_players')
        .insert({
          player_name: newPlayerName.trim(),
          sport: newPlayerSport,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setSelectedPlayers(prev => [...prev, data]);
      setNewPlayerName("");
      setNewPlayerSport("");
      toast({
        title: "Player added",
        description: `${newPlayerName} has been added to your players`,
      });
    } catch (error) {
      console.error('Error adding player:', error);
      toast({
        title: "Error",
        description: "Failed to add player",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const removePlayer = async (playerId: string, playerName: string) => {
    try {
      const { error } = await supabase
        .from('user_players')
        .delete()
        .eq('id', playerId);

      if (error) throw error;
      
      setSelectedPlayers(prev => prev.filter(p => p.id !== playerId));
      toast({
        title: "Player removed",
        description: `${playerName} has been removed from your players`,
      });
    } catch (error) {
      console.error('Error removing player:', error);
      toast({
        title: "Error",
        description: "Failed to remove player",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !adding) {
      addPlayer();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading your players...</p>
        </div>
      </div>
    );
  }

  const playersBySport = selectedPlayers.reduce((acc, player) => {
    if (!acc[player.sport]) {
      acc[player.sport] = [];
    }
    acc[player.sport].push(player);
    return acc;
  }, {} as Record<string, typeof selectedPlayers>);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Manage Players</h1>
          <div className="ml-auto">
            <Badge variant="secondary">
              {selectedPlayers.length} player{selectedPlayers.length !== 1 ? 's' : ''} selected
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Add Player Form */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Player</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="playerName">Player Name</Label>
                  <Input
                    id="playerName"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Enter player name..."
                    onKeyPress={handleKeyPress}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="playerSport">Sport</Label>
                  <Select value={newPlayerSport} onValueChange={setNewPlayerSport}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sport..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SPORTS_LIST.map((sport) => (
                        <SelectItem key={sport} value={sport}>
                          {sport}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={addPlayer} 
                    disabled={adding || !newPlayerName.trim() || !newPlayerSport}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {adding ? "Adding..." : "Add Player"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Players List */}
          {Object.keys(playersBySport).length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">No players added yet</p>
                <p className="text-sm text-muted-foreground">Add your first player using the form above</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(playersBySport).map(([sport, players]) => (
              <Card key={sport}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {sport}
                    <Badge variant="outline">
                      {players.length} player{players.length !== 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {players.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{player.player_name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePlayer(player.id, player.player_name)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default ManagePlayers;