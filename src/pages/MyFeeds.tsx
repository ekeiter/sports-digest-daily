import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import MyFeedsSkeleton from "@/components/MyFeedsSkeleton";
import { useUserPreferences, useInvalidateUserPreferences, Person, OlympicsPreference } from "@/hooks/useUserPreferences";
import { useInvalidateArticleFeed } from "@/hooks/useArticleFeed";
import sportsdigLogo from "@/assets/sportsdig-blimp-logo.png";
// Helper to properly capitalize sport names
const toTitleCase = (str: string) => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const COLLEGE_LEAGUES = ['NCAAF', 'NCAAM', 'NCAAW'];
const COUNTRY_TEAM_LEAGUES = ['World Cup', 'World Baseball Classic'];
const LEAGUE_CODE_DISPLAY: Record<string, string> = { 'World Baseball Classic': 'WBC' };

const getPersonLogo = (person: Person) => {
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
      alt: person.sports.sport || 'Sport'
    };
  }
  return null;
};

export default function MyFeeds() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toUnfollow, setToUnfollow] = useState<Set<string>>(new Set());
  const [localFocusedItems, setLocalFocusedItems] = useState<Set<string>>(new Set());
  
  // Local state for optimistic updates after deletion
  const [deletedItems, setDeletedItems] = useState<Set<string>>(new Set());

  const { data: preferences, isLoading, error } = useUserPreferences(userId);
  const invalidatePreferences = useInvalidateUserPreferences();
  const invalidateFeed = useInvalidateArticleFeed();

  // Sync focused items from query data
  useEffect(() => {
    if (preferences?.focusedItems) {
      setLocalFocusedItems(new Set(preferences.focusedItems));
    }
  }, [preferences?.focusedItems]);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
  };

  const toggleUnfollow = (kind: 'sport' | 'league' | 'team' | 'person' | 'school', id: number) => {
    const key = `${kind}-${id}`;
    const newSet = new Set(toUnfollow);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setToUnfollow(newSet);
  };

  const toggleFocus = async (e: React.MouseEvent, kind: 'sport' | 'league' | 'team' | 'person' | 'school', id: number) => {
    e.stopPropagation();
    const key = `${kind}-${id}`;
    const isCurrentlyFocused = localFocusedItems.has(key);
    
    try {
      // Update the is_focused column based on the kind
      const columnName = `${kind}_id` as 'sport_id' | 'league_id' | 'team_id' | 'person_id' | 'school_id';
      const { error } = await supabase
        .from("subscriber_interests")
        .update({ is_focused: !isCurrentlyFocused })
        .eq("subscriber_id", userId)
        .eq(columnName, id);
      
      if (error) throw error;
      
      const newFocused = new Set(localFocusedItems);
      if (!isCurrentlyFocused) {
        newFocused.add(key);
      } else {
        newFocused.delete(key);
      }
      setLocalFocusedItems(newFocused);
      
      // Invalidate caches so feed reflects the new focus state
      if (userId) {
        invalidatePreferences(userId);
        invalidateFeed(userId);
      }
      
      toast.success(!isCurrentlyFocused ? "Added to focus" : "Removed from focus");
    } catch (error) {
      console.error("Error toggling focus:", error);
      toast.error("Failed to update focus");
    }
  };

  const handleDeleteSelections = async () => {
    if (!userId) return;
    setSaving(true);
    
    try {
      // Delete all selected items using direct delete with explicit FK columns
      for (const key of toUnfollow) {
        const [kind, idStr] = key.split('-');
        const subjectId = Number(idStr);
        const columnName = `${kind}_id` as 'sport_id' | 'league_id' | 'team_id' | 'person_id' | 'school_id';
        
        await supabase
          .from("subscriber_interests")
          .delete()
          .eq("subscriber_id", userId)
          .eq(columnName, subjectId);
      }

      // Track deleted items for optimistic UI update
      setDeletedItems(prev => new Set([...prev, ...toUnfollow]));
      setToUnfollow(new Set());
      
      // Invalidate cache to refetch on next visit
      invalidatePreferences(userId);
      
      toast.success("Selections deleted");
    } catch (error) {
      console.error("Error deleting selections:", error);
      toast.error("Failed to delete selections");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !userId) {
    return <MyFeedsSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">Failed to load your preferences</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Filter out deleted items for display
  const selectedSports = (preferences?.sports || []).filter(s => !deletedItems.has(`sport-${s.id}`));
  const selectedLeagues = (preferences?.leagues || []).filter(l => !deletedItems.has(`league-${l.id}`));
  const selectedTeams = (preferences?.teams || []).filter(t => !deletedItems.has(`team-${t.id}`));
  const selectedPeople = (preferences?.people || []).filter(p => !deletedItems.has(`person-${p.id}`));
  const selectedSchools = (preferences?.schools || []).filter(s => !deletedItems.has(`school-${s.id}`));
  const olympicsPrefs = (preferences?.olympicsPrefs || []).filter(o => !deletedItems.has(`olympics-${o.id}`));

  const hasSportsLeaguesTeams = selectedSports.length > 0 || selectedLeagues.length > 0 || selectedTeams.length > 0 || selectedSchools.length > 0 || olympicsPrefs.length > 0;

  const handleDeleteOlympics = async (prefId: number) => {
    const { error } = await supabase
      .from("subscriber_interests")
      .delete()
      .eq("id", prefId);

    if (error) {
      console.error("Error removing olympics preference:", error);
      toast.error("Failed to remove preference");
      return;
    }

    setDeletedItems(prev => new Set([...prev, `olympics-${prefId}`]));
    if (userId) {
      invalidatePreferences(userId);
      invalidateFeed(userId);
    }
    toast.success("Olympics preference removed");
  };

  return (
    <div className="min-h-screen bg-[#D5D5D5]">
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex flex-col items-center">
          <img src={sportsdigLogo} alt="SportsDig" className="h-20 md:h-24 object-contain" />
          <h1 className="text-xl font-bold mt-2">My Feed Selections</h1>
        </div>
      </header>

      <div className="container mx-auto px-2 pt-2 pb-4 max-w-3xl">
        {/* Navigation Buttons - Centered at top */}
        <div className="flex justify-center gap-2 mb-2">
          <Button size="sm" className="min-w-[140px]" onClick={() => navigate("/")}>
            Dashboard
          </Button>
          <Button size="sm" className="min-w-[140px]" onClick={() => navigate("/feed")}>
            Go To Sports Feed
          </Button>
          {toUnfollow.size > 0 && (
            <Button size="sm" onClick={handleDeleteSelections} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Deleting...
                </>
              ) : (
                "Delete Selections"
              )}
            </Button>
          )}
        </div>
        <div className="border-b border-blue-300 mb-4" />

        <div className="space-y-4">
          {/* Sports/Leagues/Teams Section */}
          <Card className="bg-transparent border-none shadow-none">
            <CardHeader className="py-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Sports / Teams / Colleges</CardTitle>
                <Button size="sm" onClick={() => navigate("/preferences")}>
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              {!hasSportsLeaguesTeams ? (
                <p className="text-muted-foreground text-sm">No sports, leagues, or teams selected</p>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-end px-2">
                    <span className="text-sm text-foreground font-medium">Focus</span>
                  </div>
                  {/* Sports */}
                  {selectedSports.map(sport => {
                    const key = `sport-${sport.id}`;
                    const isMarked = toUnfollow.has(key);
                    const isFocused = localFocusedItems.has(key);
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-2 px-2 py-1 border rounded-md cursor-pointer transition-colors w-full ${
                          isMarked ? 'bg-destructive text-destructive-foreground border-destructive' : 'bg-card hover:bg-muted'
                        }`}
                        onClick={() => toggleUnfollow('sport', sport.id)}
                      >
                        {sport.logo_url && <img src={sport.logo_url} alt="" className="h-5 w-5 object-contain flex-shrink-0" />}
                        <span className="text-sm font-medium flex-1">{sport.display_label || sport.sport}</span>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={e => toggleFocus(e, 'sport', sport.id)}>
                          <Star className={`h-4 w-4 transform scale-125 origin-center ${isFocused ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                        </Button>
                      </div>
                    );
                  })}
                  
                  {/* Leagues */}
                  {selectedLeagues.map(league => {
                    const key = `league-${league.id}`;
                    const isMarked = toUnfollow.has(key);
                    const isFocused = localFocusedItems.has(key);
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-2 px-2 py-1 border rounded-md cursor-pointer transition-colors w-full ${
                          isMarked ? 'bg-destructive text-destructive-foreground border-destructive' : 'bg-card hover:bg-muted'
                        }`}
                        onClick={() => toggleUnfollow('league', league.id)}
                      >
                        {league.logo_url && <img src={league.logo_url} alt="" className="h-5 w-5 object-contain flex-shrink-0" />}
                        <span className="text-sm font-medium flex-1">{league.code || league.name}</span>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={e => toggleFocus(e, 'league', league.id)}>
                          <Star className={`h-4 w-4 transform scale-125 origin-center ${isFocused ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                        </Button>
                      </div>
                    );
                  })}
                  
                  {/* Teams */}
                  {selectedTeams.map(team => {
                    const key = `team-${team.id}`;
                    const isMarked = toUnfollow.has(key);
                    const isFocused = localFocusedItems.has(key);
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-2 px-2 py-1 border rounded-md cursor-pointer transition-colors w-full ${
                          isMarked ? 'bg-destructive text-destructive-foreground border-destructive' : 'bg-card hover:bg-muted'
                        }`}
                        onClick={() => toggleUnfollow('team', team.id)}
                      >
                        {team.logo_url && <img src={team.logo_url} alt="" className="h-5 w-5 object-contain flex-shrink-0" />}
                        <span className="text-sm font-medium flex-1">
                          {team.display_name}
                          {team.leagues?.code && (COLLEGE_LEAGUES.includes(team.leagues.code) || COUNTRY_TEAM_LEAGUES.includes(team.leagues.code)) && (
                            <span className="text-muted-foreground"> ({LEAGUE_CODE_DISPLAY[team.leagues.code] || team.leagues.code})</span>
                          )}
                        </span>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={e => toggleFocus(e, 'team', team.id)}>
                          <Star className={`h-4 w-4 transform scale-125 origin-center ${isFocused ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                        </Button>
                      </div>
                    );
                  })}
                  
                  {/* Schools */}
                  {selectedSchools.map(school => {
                    const key = `school-${school.id}`;
                    const isMarked = toUnfollow.has(key);
                    const isFocused = localFocusedItems.has(key);
                    const suffix = school.league_code ? `(${school.league_code})` : "(all sports)";
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-2 px-2 py-1 border rounded-md cursor-pointer transition-colors w-full ${
                          isMarked ? 'bg-destructive text-destructive-foreground border-destructive' : 'bg-card hover:bg-muted'
                        }`}
                        onClick={() => toggleUnfollow('school' as any, school.id)}
                      >
                        {school.logo_url && <img src={school.logo_url} alt="" className="h-5 w-5 object-contain flex-shrink-0" />}
                        <span className="text-sm font-medium flex-1">
                          {school.name} <span className="text-muted-foreground">{suffix}</span>
                        </span>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={e => toggleFocus(e, 'school' as any, school.id)}>
                          <Star className={`h-4 w-4 transform scale-125 origin-center ${isFocused ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                        </Button>
                      </div>
                    );
                  })}
                  
                  {/* Olympics */}
                  {olympicsPrefs.map(pref => (
                    <div
                      key={`olympics-${pref.id}`}
                      className="flex items-center gap-2 px-2 py-1 border rounded-md bg-card"
                    >
                      {pref.sport_logo && (
                        <img src={pref.sport_logo} alt="" className="h-5 w-5 object-contain flex-shrink-0" />
                      )}
                      {!pref.sport_logo && pref.country_logo && (
                        <img src={pref.country_logo} alt="" className="h-5 w-4 object-contain flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium flex-1">
                        OLY - {pref.sport_name ? toTitleCase(pref.sport_name) : "All Sports"} - {pref.country_name || "All Countries"}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteOlympics(pref.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* People Section */}
          <Card className="bg-transparent border-none shadow-none">
            <CardHeader className="py-2 space-y-1">
              <CardTitle className="text-base text-center">Players & Coaches</CardTitle>
              <div className="flex justify-center">
                <Button size="sm" onClick={() => navigate("/player-preferences")}>
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              {selectedPeople.length === 0 ? (
                <p className="text-muted-foreground text-sm">No players or coaches selected</p>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-end px-2">
                    <span className="text-sm text-foreground font-medium">Focus</span>
                  </div>
                  {selectedPeople.map(person => {
                    const key = `person-${person.id}`;
                    const isMarked = toUnfollow.has(key);
                    const isFocused = localFocusedItems.has(key);
                    const context = [];
                    if (person.teams?.display_name) context.push(person.teams.display_name);
                    if (person.leagues?.code) context.push(person.leagues.code);
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-2 px-2 py-1 border rounded-md cursor-pointer transition-colors w-full ${
                          isMarked ? 'bg-destructive text-destructive-foreground border-destructive' : 'bg-card hover:bg-muted'
                        }`}
                        onClick={() => toggleUnfollow('person', person.id)}
                      >
                        {(() => {
                          const logo = getPersonLogo(person);
                          return logo ? <img src={logo.url} alt={logo.alt} className="h-5 w-5 object-contain flex-shrink-0" /> : null;
                        })()}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold">{person.name}</span>
                          {context.length > 0 && <span className="text-sm text-muted-foreground ml-1">({context.join(" • ")})</span>}
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 flex-shrink-0" onClick={e => toggleFocus(e, 'person', person.id)}>
                          <Star className={`h-4 w-4 transform scale-125 origin-center ${isFocused ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
