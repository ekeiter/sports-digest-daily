import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Plus, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInvalidateUserPreferences } from "@/hooks/useUserPreferences";
import sportsDigBlimpLogo from "@/assets/sportsdig-blimp-logo.png";
import { useInvalidateArticleFeed } from "@/hooks/useArticleFeed";

// Helper to properly capitalize sport names
const toTitleCase = (str: string) => {
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};
interface WinterSport {
  sport_id: number;
  sport_name: string;
  logo_url: string | null;
}
interface Country {
  id: number;
  name: string;
  code: string;
  logo_url: string | null;
}
interface OlympicsPreference {
  id: number;
  sport_id: number | null;
  country_id: number | null;
  sport_name?: string;
  sport_logo?: string | null;
  country_name?: string;
  country_logo?: string | null;
}
export default function OlympicsPreferences() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [winterSports, setWinterSports] = useState<WinterSport[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [existingPrefs, setExistingPrefs] = useState<OlympicsPreference[]>([]);
  const invalidatePreferences = useInvalidateUserPreferences();
  const invalidateFeed = useInvalidateArticleFeed();
  useEffect(() => {
    checkUser();
  }, []);
  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);
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
    setUserId(user.id);
  };
  const fetchData = async () => {
    setLoading(true);

    // Fetch winter sports with sport names and logos
    const {
      data: sportsData
    } = await supabase.from("olympic_sports").select("sport_id, logo_url, sports!inner(sport)").eq("is_winter", true);
    if (sportsData) {
      const mapped = sportsData.map((item: any) => ({
        sport_id: item.sport_id,
        sport_name: item.sports.sport,
        logo_url: item.logo_url
      })).sort((a, b) => a.sport_name.localeCompare(b.sport_name));
      setWinterSports(mapped);
    }

    // Fetch winter olympic countries
    const {
      data: countriesData
    } = await supabase.from("countries").select("id, name, code, logo_url").eq("is_winter_olympics", true).order("name");
    if (countriesData) {
      setCountries(countriesData);
    }

    // Fetch existing olympics preferences
    await fetchExistingPrefs();
    setLoading(false);
  };
  const fetchExistingPrefs = async () => {
    if (!userId) return;
    const {
      data: prefsData
    } = await supabase.from("subscriber_interests").select("id, sport_id, country_id").eq("subscriber_id", userId).eq("is_olympics", true);
    if (prefsData) {
      // Enrich with sport/country names
      const enriched = await Promise.all(prefsData.map(async pref => {
        let sport_name: string | undefined;
        let sport_logo: string | null | undefined;
        let country_name: string | undefined;
        let country_logo: string | null | undefined;
        if (pref.sport_id) {
          const {
            data: sportData
          } = await supabase.from("sports").select("sport").eq("id", pref.sport_id).single();
          const {
            data: olympicData
          } = await supabase.from("olympic_sports").select("logo_url").eq("sport_id", pref.sport_id).single();
          sport_name = sportData?.sport;
          sport_logo = olympicData?.logo_url;
        }
        if (pref.country_id) {
          const {
            data: countryData
          } = await supabase.from("countries").select("name, logo_url").eq("id", pref.country_id).single();
          country_name = countryData?.name;
          country_logo = countryData?.logo_url;
        }
        return {
          ...pref,
          sport_name,
          sport_logo,
          country_name,
          country_logo
        };
      }));
      setExistingPrefs(enriched);
    }
  };
  const handleAddPreference = async () => {
    if (!userId) return;
    const sportId = selectedSport ? Number(selectedSport) : null;
    const countryId = selectedCountry ? Number(selectedCountry) : null;

    // Check if this combination already exists
    const exists = existingPrefs.some(p => p.sport_id === sportId && p.country_id === countryId);
    if (exists) {
      toast.error("This preference already exists");
      return;
    }
    const {
      error
    } = await supabase.from("subscriber_interests").insert({
      subscriber_id: userId,
      sport_id: sportId,
      country_id: countryId,
      is_olympics: true
    });
    if (error) {
      console.error("Error adding preference:", error);
      toast.error("Failed to add preference");
      return;
    }
    toast.success("Preference added");
    setSelectedSport("");
    setSelectedCountry("");
    await fetchExistingPrefs();

    // Invalidate caches so other pages reflect the change
    if (userId) {
      invalidatePreferences(userId);
      invalidateFeed(userId);
    }
  };
  const handleRemovePreference = async (prefId: number) => {
    const {
      error
    } = await supabase.from("subscriber_interests").delete().eq("id", prefId);
    if (error) {
      console.error("Error removing preference:", error);
      toast.error("Failed to remove preference");
      return;
    }
    toast.success("Preference removed");
    setExistingPrefs(prev => prev.filter(p => p.id !== prefId));

    // Invalidate caches so other pages reflect the change
    if (userId) {
      invalidatePreferences(userId);
      invalidateFeed(userId);
    }
  };

  // Always allow add - blank means "all"
  const canAdd = true;
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-[#D5D5D5]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>;
  }
  return <div className="min-h-screen bg-[#D5D5D5]">
      <header className="bg-transparent">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <img src={sportsDigBlimpLogo} alt="SportsDig" className="h-10 md:h-12" />
              <span className="text-lg md:text-xl font-bold text-black">- Olympics</span>
            </div>
            <div className="flex gap-1.5 md:gap-2">
              <Button className="text-sm px-3 md:px-4" onClick={() => navigate("/")}>
                Dashboard
              </Button>
              <Button className="text-sm px-3 md:px-4" onClick={() => navigate("/preferences")}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Selector
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-2 max-w-3xl">
        <div className="bg-white/90 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold text-black mb-4">Winter Olympics Selector</h2>
          
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
                      {winterSports.map(sport => <SelectItem key={sport.sport_id} value={sport.sport_id.toString()}>
                          <div className="flex items-center gap-2">
                            {sport.logo_url && <img src={sport.logo_url} alt="" className="w-5 h-5 object-contain" />}
                            {toTitleCase(sport.sport_name)}
                          </div>
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                  {selectedSport && <button type="button" onClick={() => setSelectedSport("")} className="flex items-center justify-center w-10 h-10 bg-white border border-input rounded-md hover:bg-gray-100">
                      <X className="h-4 w-4 text-gray-500" />
                    </button>}
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
                      {countries.map(country => <SelectItem key={country.id} value={country.id.toString()}>
                          <div className="flex items-center gap-2">
                            {country.logo_url && <img src={country.logo_url} alt="" className="w-5 h-4 object-contain" />}
                            {country.name}
                          </div>
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                  {selectedCountry && <button type="button" onClick={() => setSelectedCountry("")} className="flex items-center justify-center w-10 h-10 bg-white border border-input rounded-md hover:bg-gray-100">
                      <X className="h-4 w-4 text-gray-500" />
                    </button>}
                </div>
              </div>
            </div>
              

            <Button onClick={handleAddPreference} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-1" />
              Add Favorite 
            </Button>
          </div>

          {/* Existing Preferences */}
          {existingPrefs.length > 0 && <div className="mt-6">
              <h3 className="text-lg font-semibold text-black mb-3">Your Olympics Favorites</h3>
              <div className="space-y-2">
                {existingPrefs.map(pref => <div key={pref.id} className="flex items-center justify-between gap-2 px-3 py-2 bg-white border rounded-md">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-black">OLY</span>
                      <span className="text-muted-foreground">-</span>
                      {pref.sport_logo && <img src={pref.sport_logo} alt="" className="w-5 h-5 object-contain" />}
                      <span className="text-sm">
                        {pref.sport_name ? toTitleCase(pref.sport_name) : "All Sports"}
                      </span>
                      <span className="text-muted-foreground">-</span>
                      {pref.country_logo && <img src={pref.country_logo} alt="" className="w-5 h-4 object-contain" />}
                      <span className="text-sm">
                        {pref.country_name || "All Countries"}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemovePreference(pref.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>)}
              </div>
            </div>}
        </div>
      </main>
    </div>;
}