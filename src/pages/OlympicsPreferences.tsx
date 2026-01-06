import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Plus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper to properly capitalize sport names
const toTitleCase = (str: string) => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface WinterSport {
  sport_id: number;
  sport_name: string;
}

interface Country {
  id: number;
  name: string;
  code: string;
  logo_url: string | null;
}

export default function OlympicsPreferences() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [winterSports, setWinterSports] = useState<WinterSport[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
  };

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch winter sports with sport names
    const { data: sportsData } = await supabase
      .from("olympic_sports")
      .select("sport_id, sports!inner(sport)")
      .eq("is_winter", true);

    if (sportsData) {
      const mapped = sportsData.map((item: any) => ({
        sport_id: item.sport_id,
        sport_name: item.sports.sport,
      })).sort((a, b) => a.sport_name.localeCompare(b.sport_name));
      setWinterSports(mapped);
    }

    // Fetch winter olympic countries
    const { data: countriesData } = await supabase
      .from("countries")
      .select("id, name, code, logo_url")
      .eq("is_winter_olympics", true)
      .order("name");

    if (countriesData) {
      setCountries(countriesData);
    }

    setLoading(false);
  };

  const handleAddPreference = () => {
    // TODO: Add preference to database
    console.log("Adding preference:", { sport: selectedSport, country: selectedCountry });
  };

  const canAdd = selectedSport && selectedCountry;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#D5D5D5]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#D5D5D5]">
      <header className="bg-transparent">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-black">
              <span className="font-racing text-2xl md:text-3xl">SportsDig</span> <span className="text-lg md:text-xl">- Olympics</span>
            </h1>
            <div className="flex gap-1.5 md:gap-2">
              <Button className="text-sm px-3 md:px-4" onClick={() => navigate("/")}>
                Dashboard
              </Button>
              <Button className="text-sm px-3 md:px-4" onClick={() => navigate("/preferences")}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Preferences
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-2 max-w-3xl">
        <div className="bg-white/90 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold text-black mb-4">Winter Olympics Preferences</h2>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-black mb-1">Select Sport (leave blank for all)</label>
                <div className="flex gap-2">
                  <Select value={selectedSport} onValueChange={setSelectedSport}>
                    <SelectTrigger className="flex-1 bg-white">
                      <SelectValue placeholder="Select a sport" />
                    </SelectTrigger>
                    <SelectContent>
                      {winterSports.map((sport) => (
                        <SelectItem key={sport.sport_id} value={sport.sport_id.toString()}>
                          {toTitleCase(sport.sport_name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedSport && (
                    <button
                      type="button"
                      onClick={() => setSelectedSport("")}
                      className="flex items-center justify-center w-10 h-10 bg-white border border-input rounded-md hover:bg-gray-100"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-black mb-1">Select Country (leave blank for all)</label>
                <div className="flex gap-2">
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger className="flex-1 bg-white">
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id.toString()}>
                          <div className="flex items-center gap-2">
                            {country.logo_url && (
                              <img src={country.logo_url} alt="" className="w-5 h-4 object-contain" />
                            )}
                            {country.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCountry && (
                    <button
                      type="button"
                      onClick={() => setSelectedCountry("")}
                      className="flex items-center justify-center w-10 h-10 bg-white border border-input rounded-md hover:bg-gray-100"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  )}
                </div>
              </div>
            </div>
              

            <Button 
              onClick={handleAddPreference} 
              disabled={!canAdd}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Preference
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}