import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { searchPeople, type PersonSearchResult } from "@/lib/searchPeople";
import { useInvalidateUserPreferences } from "@/hooks/useUserPreferences";
import { useInvalidateArticleFeed } from "@/hooks/useArticleFeed";
import sportsdigLogo from "@/assets/sportsdig-blimp-logo.png";

export default function PlayerPreferences() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<PersonSearchResult[]>([]);
  const [followedPeople, setFollowedPeople] = useState<PersonSearchResult[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<number>>(new Set());
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  
  const invalidatePreferences = useInvalidateUserPreferences();
  const invalidateFeed = useInvalidateArticleFeed();
  
  useEffect(() => {
    checkUserAndLoadData();
  }, []);

  // Debounced autocomplete search
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      setShowAutocomplete(false);
      return;
    }
    const timeoutId = setTimeout(() => {
      performSearch(true);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Click outside to close autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent body scroll when dropdown is open
  useEffect(() => {
    if (showAutocomplete) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAutocomplete]);
  const checkUserAndLoadData = async () => {
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
    await Promise.all([loadFollowedPeople(user.id), supabase.rpc('ensure_my_subscriber')]);
    setLoading(false);
  };
  const loadFollowedPeople = async (userId: string) => {
    // Query subscriber_interests using explicit person_id column
    const {
      data: interests
    } = await supabase
      .from("subscriber_interests")
      .select("person_id")
      .eq("subscriber_id", userId)
      .not("person_id", "is", null);
      
    if (!interests || interests.length === 0) {
      setFollowedPeople([]);
      setFollowedIds(new Set());
      return;
    }
    
    const personIds = interests.map(i => i.person_id as number);
    setFollowedIds(new Set(personIds));
    
    const {
      data: people
    } = await supabase.from("people").select(`
        id,
        name,
        role,
        position,
        team_id,
        teams (
          id,
          display_name,
          nickname,
          logo_url
        ),
        league_id,
        leagues (
          id,
          code,
          name,
          logo_url
        ),
        sport_id,
        sports (
          id,
          sport,
          display_label,
          logo_url
        ),
        school_id,
        schools (
          id,
          name,
          short_name,
          logo_url
        )
      `).in("id", personIds);
    if (people) setFollowedPeople(people as unknown as PersonSearchResult[]);
  };
  const performSearch = async (isAutocomplete: boolean = false) => {
    const term = searchTerm.trim();
    if (term.length < 2) {
      if (!isAutocomplete) {
        toast.error("Please enter at least 2 characters");
      }
      return;
    }
    setSearching(true);
    try {
      const results = await searchPeople(term);
      if (results.length === 0 && !isAutocomplete) {
        toast.info("No players or coaches found matching your search");
      }
      setSearchResults(results);
      if (isAutocomplete) {
        setShowAutocomplete(results.length > 0);
      }
    } catch (error: any) {
      console.error("Search error:", error);
      if (!isAutocomplete) {
        toast.error(`Search failed: ${error.message ?? "Unknown error"}`);
      }
    } finally {
      setSearching(false);
    }
  };
  const handleSearch = () => {
    setShowAutocomplete(false);
    performSearch(false);
  };
  const handleFollow = async (person: PersonSearchResult) => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) return;
    const {
      error
    } = await supabase.from("subscriber_interests").insert({
      subscriber_id: user.id,
      person_id: person.id,
      notification_enabled: true,
      priority: 1
    });
    if (error) {
      toast.error("Failed to follow");
      return;
    }
    toast.success(`Now following ${person.name}`);
    setFollowedIds(prev => new Set([...prev, person.id]));
    setFollowedPeople(prev => [...prev, person]);
    setSearchResults(prev => prev.filter(p => p.id !== person.id));
    setShowAutocomplete(false);
    setSearchTerm("");
    
    // Invalidate caches so other pages reflect the change
    if (userId) {
      invalidatePreferences(userId);
      invalidateFeed(userId);
    }
  };
  const handleUnfollow = async (personId: number) => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) return;
    const {
      error
    } = await supabase.from("subscriber_interests").delete()
      .eq("subscriber_id", user.id)
      .eq("person_id", personId);
    if (error) {
      toast.error("Failed to unfollow");
      return;
    }
    toast.success("Unfollowed");
    setFollowedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(personId);
      return newSet;
    });
    setFollowedPeople(prev => prev.filter(p => p.id !== personId));
    
    // Invalidate caches so other pages reflect the change
    if (userId) {
      invalidatePreferences(userId);
      invalidateFeed(userId);
    }
  };
  const getContextDisplay = (person: PersonSearchResult) => {
    const parts: string[] = [];
    if (person.teams?.display_name) parts.push(person.teams.display_name);
    else if (person.schools?.short_name) parts.push(person.schools.short_name);
    if (person.leagues?.code) parts.push(person.leagues.code);
    if (person.position) parts.push(person.position);
    return parts.join(" • ");
  };
  const getPersonLogo = (person: PersonSearchResult) => {
    if (person.teams?.logo_url) {
      return {
        url: person.teams.logo_url,
        alt: person.teams.display_name || 'Team'
      };
    }
    if (person.schools?.logo_url) {
      return {
        url: person.schools.logo_url,
        alt: person.schools.short_name || 'School'
      };
    }
    if (person.leagues?.logo_url) {
      return {
        url: person.leagues.logo_url,
        alt: person.leagues.name || 'League'
      };
    }
    if (person.sports?.logo_url) {
      return {
        url: person.sports.logo_url,
        alt: person.sports.display_label || person.sports.sport || 'Sport'
      };
    }
    return null;
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>;
  }
  return <div className="min-h-screen bg-[#D5D5D5]">
      <header className="bg-transparent">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-4">
              <img 
                src={sportsdigLogo} 
                alt="SportsDig Logo" 
                className="h-16 md:h-20"
              />
              <span className="text-lg md:text-xl font-bold text-black">Player/Coach Selector</span>
            </div>
            <div className="flex gap-1.5 md:gap-2">
              <Button className="text-sm px-3 md:px-4" onClick={() => navigate("/")}>
                Dashboard
              </Button>
              <Button className="text-sm px-3 md:px-4" onClick={() => navigate("/my-feeds")}>
                My Selections
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 max-w-3xl">
        <div className="space-y-4">

          {/* Search Section */}
          <div className="bg-transparent border-none shadow-none">
            <div className="py-1">
              <p className="flex items-center gap-2 text-black font-bold text-base">
                <Search className="h-4 w-4" />
                Search Players & Coaches
              </p>
            </div>
            <div className="py-2">
              <div className="relative" ref={autocompleteRef}>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input placeholder="Enter name" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} onFocus={() => searchResults.length > 0 && setShowAutocomplete(true)} className="pr-8 bg-card" />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => { setSearchTerm(""); setSearchResults([]); setShowAutocomplete(false); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Button onClick={handleSearch} disabled={searching}>
                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Autocomplete dropdown */}
                {showAutocomplete && searchResults.length > 0 && <div className="absolute z-10 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    {searchResults.map(person => {
                  const isFollowed = followedIds.has(person.id);
                  return <div key={person.id} className={`px-2 py-1 hover:bg-accent cursor-pointer border-b last:border-b-0 flex items-center gap-2 ${isFollowed ? 'opacity-50' : ''}`} onClick={() => !isFollowed && handleFollow(person)}>
                          {(() => {
                        const logo = getPersonLogo(person);
                        return logo ? <img src={logo.url} alt={logo.alt} className="h-8 w-8 object-contain flex-shrink-0" /> : null;
                      })()}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold flex items-center gap-2 whitespace-nowrap">
                              {person.name}
                              {person.role === 'coach' && <span className="text-xs bg-muted px-2 py-0.5 rounded">Coach</span>}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {getContextDisplay(person)}
                            </div>
                          </div>
                        </div>;
                })}
                  </div>}
              </div>
            </div>
          </div>

          {/* Followed People Section */}
          <div className="bg-transparent border-none shadow-none">
            <div className="py-1">
              <p className="text-black font-bold text-base">Your Player and Coach Selections ({followedPeople.length})</p>
            </div>
            <div className="px-0">
              {followedPeople.length === 0 ? <p className="text-sm text-muted-foreground">No players or coaches followed yet. Search above to get started!</p> : <div className="space-y-1">
                  {followedPeople.map(person => <div key={person.id} className="px-2 py-1 border rounded-lg bg-card flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {(() => {
                    const logo = getPersonLogo(person);
                    return logo ? <img src={logo.url} alt={logo.alt} className="h-8 w-8 object-contain flex-shrink-0" /> : null;
                  })()}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold flex items-center gap-2 whitespace-nowrap">
                            {person.name}
                            {person.role === 'coach' && <span className="text-xs bg-muted px-2 py-0.5 rounded">Coach</span>}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {getContextDisplay(person)}
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="flex-shrink-0" onClick={() => handleUnfollow(person.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>)}
                </div>}
            </div>
          </div>
        </div>
      </div>
    </div>;
}