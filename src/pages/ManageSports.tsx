import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SPORTS_CATEGORIES = {
  "Professional Sports": [
    "Golf", "Auto Racing (NASCAR)", "Formula 1", "Tennis", "Soccer/Football", 
    "Boxing", "Mixed Martial Arts (MMA)", "Wrestling (WWE)", "IndyCar Racing"
  ],
  "Olympic Sports": [
    "Swimming", "Track and Field", "Gymnastics", "Figure Skating", "Skiing", 
    "Snowboarding", "Cycling", "Volleyball", "Soccer (Olympic)", "Basketball (Olympic)"
  ],
  "College Sports": [
    "College Football", "College Basketball", "College Baseball", "College Soccer",
    "College Hockey", "College Softball", "College Golf", "College Tennis"
  ],
  "International Sports": [
    "Cricket", "Rugby", "Australian Football", "Field Hockey", "Handball", 
    "Water Polo", "Badminton", "Table Tennis", "Lacrosse"
  ],
  "Extreme Sports": [
    "Skateboarding", "BMX", "Surfing", "Rock Climbing", "Snowboarding (Freestyle)",
    "Motocross", "Wakeboarding", "Parkour"
  ],
  "Other Sports": [
    "Horse Racing", "Fishing/Bass Fishing", "Bowling", "Darts", "Pool/Billiards",
    "Esports", "Sailing", "Rowing", "Cross Country", "Marathon Running"
  ]
};

const ManageSports = () => {
  const [selectedSports, setSelectedSports] = useState<Array<{id: string, sport_name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadUserSports();
  }, []);

  const loadUserSports = async () => {
    try {
      const { data, error } = await supabase
        .from('user_sports')
        .select('*')
        .order('sport_name');

      if (error) throw error;
      setSelectedSports(data || []);
    } catch (error) {
      console.error('Error loading sports:', error);
      toast({
        title: "Error",
        description: "Failed to load your sports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSport = async (sportName: string) => {
    const existingSport = selectedSports.find(s => s.sport_name === sportName);
    
    if (existingSport) {
      // Remove sport
      try {
        const { error } = await supabase
          .from('user_sports')
          .delete()
          .eq('id', existingSport.id);

        if (error) throw error;
        
        setSelectedSports(prev => prev.filter(s => s.id !== existingSport.id));
        toast({
          title: "Sport removed",
          description: `${sportName} has been removed from your sports`,
        });
      } catch (error) {
        console.error('Error removing sport:', error);
        toast({
          title: "Error",
          description: "Failed to remove sport",
          variant: "destructive",
        });
      }
    } else {
      // Add sport
      try {
        const { data, error } = await supabase
          .from('user_sports')
          .insert({
            sport_name: sportName,
            user_id: (await supabase.auth.getUser()).data.user?.id
          })
          .select()
          .single();

        if (error) throw error;
        
        setSelectedSports(prev => [...prev, data]);
        toast({
          title: "Sport added",
          description: `${sportName} has been added to your sports`,
        });
      } catch (error) {
        console.error('Error adding sport:', error);
        toast({
          title: "Error",
          description: "Failed to add sport",
          variant: "destructive",
        });
      }
    }
  };

  const isSportSelected = (sportName: string) => {
    return selectedSports.some(s => s.sport_name === sportName);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading your sports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Manage Sports</h1>
          <div className="ml-auto">
            <Badge variant="secondary">
              {selectedSports.length} sport{selectedSports.length !== 1 ? 's' : ''} selected
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {Object.entries(SPORTS_CATEGORIES).map(([category, sports]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {category}
                  <Badge variant="outline">
                    {selectedSports.filter(s => sports.includes(s.sport_name)).length} selected
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {sports.map((sport) => {
                    const isSelected = isSportSelected(sport);
                    return (
                      <Button
                        key={sport}
                        variant={isSelected ? "default" : "outline"}
                        className="justify-start h-auto p-3 text-left"
                        onClick={() => toggleSport(sport)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm">{sport}</span>
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

export default ManageSports;