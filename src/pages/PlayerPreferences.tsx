import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, User, X } from "lucide-react";
import { toast } from "sonner";
import { searchPeople, type PersonSearchResult } from "@/lib/searchPeople";
export default function PlayerPreferences() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<PersonSearchResult[]>([]);
  const [followedPeople, setFollowedPeople] = useState<PersonSearchResult[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<number>>(new Set());
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);
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
    await Promise.all([loadFollowedPeople(user.id), supabase.rpc('ensure_my_subscriber')]);
    setLoading(false);
  };
  const loadFollowedPeople = async (userId: string) => {
    const {
      data: interests
    } = await supabase.from("subscriber_interests").select("subject_id").eq("subscriber_id", userId).eq("kind", "person");
    if (!interests || interests.length === 0) {
      setFollowedPeople([]);
      setFollowedIds(new Set());
      return;
    }
    const personIds = interests.map(i => i.subject_id);
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
          display_name,
          logo_url
        )
      `).in("id", personIds).eq("is_active", true);
    if (people) setFollowedPeople(people as PersonSearchResult[]);
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
      kind: "person",
      subject_id: person.id,
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
    } = await supabase.from("subscriber_interests").delete().eq("subscriber_id", user.id).eq("kind", "person").eq("subject_id", personId);
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
  };
  const getContextDisplay = (person: PersonSearchResult) => {
    const parts = [];
    if (person.teams?.display_name) parts.push(person.teams.display_name);
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
    if (person.leagues?.logo_url) {
      return {
        url: person.leagues.logo_url,
        alt: person.leagues.name || 'League'
      };
    }
    if (person.sports?.logo_url) {
      return {
        url: person.sports.logo_url,
        alt: person.sports.display_name || 'Sport'
      };
    }
    return null;
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-center">Player & Coach Preferences</h1>
            <Button variant="default" onClick={() => navigate("/")}>
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="space-y-4">

          {/* Search Section */}
          <Card>
            <CardHeader className="pb-2 pt-0">
            <CardDescription className="flex items-center gap-2 text-foreground font-bold">
                <Search className="h-4 w-4" />
                Search Players & Coaches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative" ref={autocompleteRef}>
                <div className="flex gap-2">
                  <Input placeholder="Enter name" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} onFocus={() => searchResults.length > 0 && setShowAutocomplete(true)} />
                  <Button onClick={handleSearch} disabled={searching}>
                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Autocomplete dropdown */}
                {showAutocomplete && searchResults.length > 0 && <div className="absolute z-10 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    {searchResults.map(person => {
                  const isFollowed = followedIds.has(person.id);
                  return <div key={person.id} className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0 flex items-center justify-between" onClick={() => !isFollowed && handleFollow(person)}>
                          <div className="flex items-center gap-3 flex-1">
                            {(() => {
                        const logo = getPersonLogo(person);
                        return logo ? <img src={logo.url} alt={logo.alt} className="h-8 w-8 object-contain" /> : null;
                      })()}
                            <div className="flex-1">
                              <div className="font-semibold flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {person.name}
                                {person.role === 'coach' && <span className="text-xs bg-muted px-2 py-0.5 rounded">Coach</span>}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {getContextDisplay(person)}
                              </div>
                            </div>
                          </div>
                          {isFollowed ? <span className="text-sm text-muted-foreground">Following</span> : <span className="text-sm text-primary">Click to follow</span>}
                        </div>;
                })}
                  </div>}
              </div>
            </CardContent>
          </Card>

          {/* Followed People Section */}
          <Card>
            <CardHeader>
              <CardTitle>Your Favorite Players ({followedPeople.length})</CardTitle>
            </CardHeader>
            <CardContent className="px-3">
              {followedPeople.length === 0 ? <p className="text-muted-foreground">No players or coaches followed yet. Search above to get started!</p> : <div className="space-y-2">
                  {followedPeople.map(person => <div key={person.id} className="p-3 border rounded-lg bg-card flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {(() => {
                    const logo = getPersonLogo(person);
                    return logo ? <img src={logo.url} alt={logo.alt} className="h-8 w-8 object-contain flex-shrink-0" /> : null;
                  })()}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 flex-1 min-w-0">
                          <div className="font-semibold flex items-center gap-2 whitespace-nowrap">
                            <User className="h-4 w-4 flex-shrink-0" />
                            {person.name}
                            {person.role === 'coach' && <span className="text-xs bg-muted px-2 py-0.5 rounded">Coach</span>}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {getContextDisplay(person)}
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="flex-shrink-0" onClick={() => handleUnfollow(person.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>)}
                </div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
}