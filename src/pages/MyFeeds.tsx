import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import MyFeedsSkeleton from "@/components/MyFeedsSkeleton";
import SwipeableFeedItem from "@/components/SwipeableFeedItem";
import { useUserPreferences, useInvalidateUserPreferences, Person, OlympicsPreference } from "@/hooks/useUserPreferences";
import { useInvalidateArticleFeed } from "@/hooks/useArticleFeed";
import sportsdigLogo from "@/assets/sportsdig-blimp-logo.png";
import { useIsMobile } from "@/hooks/use-mobile";

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
  // Priority: Team → School → League → Sport (country flag shown inline)
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

const getContextDisplay = (person: Person) => {
  const parts: string[] = [];
  if (person.teams?.display_name) parts.push(person.teams.display_name);
  else if (person.schools?.short_name) parts.push(person.schools.short_name);
  if (person.leagues?.code) parts.push(person.leagues.code);
  if (person.position) parts.push(person.position);
  return parts.join(" • ");
};

export default function MyFeeds() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  // Local state for optimistic updates after deletion
  const [deletedItems, setDeletedItems] = useState<Set<string>>(new Set());

  const { data: preferences, isLoading, error } = useUserPreferences(userId);
  const invalidatePreferences = useInvalidateUserPreferences();
  const invalidateFeed = useInvalidateArticleFeed();


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

  const handleDeleteItem = async (kind: 'sport' | 'league' | 'team' | 'person' | 'school', id: number) => {
    if (!userId) return;
    
    try {
      const columnName = `${kind}_id` as 'sport_id' | 'league_id' | 'team_id' | 'person_id' | 'school_id';
      const { error } = await supabase
        .from("subscriber_interests")
        .delete()
        .eq("subscriber_id", userId)
        .eq(columnName, id);
      
      if (error) throw error;
      
      const key = `${kind}-${id}`;
      setDeletedItems(prev => new Set([...prev, key]));
      
      if (userId) {
        invalidatePreferences(userId);
        invalidateFeed(userId);
      }
      
      toast.success("Removed from feed");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to remove item");
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
      <header className="bg-transparent">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-4">
              <img src={sportsdigLogo} alt="SportsDig Logo" className="h-16 md:h-20" />
              <span className="text-lg md:text-xl font-bold text-black">My Feed Selections</span>
            </div>
            <div className="flex gap-1.5 md:gap-2">
              <Button className="text-sm px-3 md:px-4" onClick={() => navigate("/")}>
                Dashboard
              </Button>
              <Button className="text-sm px-3 md:px-4" onClick={() => navigate("/feed")}>
                Go To Sports Feed
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 pt-2 pb-4 max-w-3xl">
        <div className="space-y-4">
          {/* Sports/Leagues/Teams Section */}
          <Card className="bg-transparent border-none shadow-none">
            <CardHeader className="py-0 pb-2">
              <div className="flex items-center justify-center gap-2">
                <CardTitle className="text-base w-48 text-center">Sports / Teams / Colleges</CardTitle>
                <Button size="sm" className="w-20" onClick={() => navigate("/preferences")}>
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              {!hasSportsLeaguesTeams ? (
                <p className="text-muted-foreground text-sm">No sports, leagues, or teams selected</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* Swipe hint for mobile users */}
                  {isMobile && (selectedSports.length > 0 || selectedLeagues.length > 0 || selectedTeams.length > 0 || selectedSchools.length > 0 || olympicsPrefs.length > 0) && (
                    <p className="text-xs text-muted-foreground text-center mb-1">
                      Swipe right on any item to focus your feed
                    </p>
                  )}
                  
                  {/* Sports */}
                  {selectedSports.map(sport => (
                    <SwipeableFeedItem
                      key={`sport-${sport.id}`}
                      focusType="sport"
                      focusId={sport.id}
                      deleteButton={
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive flex-shrink-0"
                          onClick={() => handleDeleteItem('sport', sport.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                    >
                      {sport.logo_url && <img src={sport.logo_url} alt="" className="h-5 w-5 object-contain flex-shrink-0" />}
                      <span className="text-sm font-medium flex-1">{sport.display_label || sport.sport}</span>
                    </SwipeableFeedItem>
                  ))}
                  
                  {/* Leagues */}
                  {selectedLeagues.map(league => (
                    <SwipeableFeedItem
                      key={`league-${league.id}`}
                      focusType="league"
                      focusId={league.id}
                      deleteButton={
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive flex-shrink-0"
                          onClick={() => handleDeleteItem('league', league.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                    >
                      {league.logo_url && <img src={league.logo_url} alt="" className="h-5 w-5 object-contain flex-shrink-0" />}
                      <span className="text-sm font-medium flex-1">{league.code || league.name}</span>
                    </SwipeableFeedItem>
                  ))}
                  
                  {/* Teams */}
                  {selectedTeams.map(team => (
                    <SwipeableFeedItem
                      key={`team-${team.id}`}
                      focusType="team"
                      focusId={team.id}
                      deleteButton={
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive flex-shrink-0"
                          onClick={() => handleDeleteItem('team', team.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                    >
                      {team.logo_url && <img src={team.logo_url} alt="" className="h-5 w-5 object-contain flex-shrink-0" />}
                      <span className="text-sm font-medium flex-1">
                        {team.display_name}
                        {team.leagues?.code && (COLLEGE_LEAGUES.includes(team.leagues.code) || COUNTRY_TEAM_LEAGUES.includes(team.leagues.code)) && (
                          <span className="text-muted-foreground"> ({LEAGUE_CODE_DISPLAY[team.leagues.code] || team.leagues.code})</span>
                        )}
                      </span>
                    </SwipeableFeedItem>
                  ))}
                  
                  {/* Schools */}
                  {selectedSchools.map(school => {
                    const suffix = school.league_code ? `(${school.league_code})` : "(all sports)";
                    return (
                      <SwipeableFeedItem
                        key={`school-${school.id}`}
                        focusType="school"
                        focusId={school.id}
                        deleteButton={
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive flex-shrink-0"
                            onClick={() => handleDeleteItem('school', school.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                      >
                        {school.logo_url && <img src={school.logo_url} alt="" className="h-5 w-5 object-contain flex-shrink-0" />}
                        <span className="text-sm font-medium flex-1">
                          {school.name} <span className="text-muted-foreground">{suffix}</span>
                        </span>
                      </SwipeableFeedItem>
                    );
                  })}
                  
                  {/* Olympics */}
                  {olympicsPrefs.map(pref => (
                    <SwipeableFeedItem
                      key={`olympics-${pref.id}`}
                      focusType="olympics"
                      focusId={pref.id}
                      deleteButton={
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive flex-shrink-0"
                          onClick={() => handleDeleteOlympics(pref.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
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
                    </SwipeableFeedItem>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* People Section */}
          <Card className="bg-transparent border-none shadow-none">
            <CardHeader className="py-0 pb-2">
              <div className="flex items-center justify-center gap-2">
                <CardTitle className="text-base w-48 text-center">Players & Coaches</CardTitle>
                <Button size="sm" className="w-20" onClick={() => navigate("/player-preferences")}>
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              {selectedPeople.length === 0 ? (
                <p className="text-muted-foreground text-sm">No players or coaches selected</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* Swipe hint for mobile users */}
                  {isMobile && (
                    <p className="text-xs text-muted-foreground text-center mb-1">
                      Swipe right on any item to focus your feed
                    </p>
                  )}
                  
                  {selectedPeople.map(person => {
                    const context = getContextDisplay(person);
                    return (
                      <SwipeableFeedItem
                        key={`person-${person.id}`}
                        focusType="person"
                        focusId={person.id}
                        deleteButton={
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 flex-shrink-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteItem('person', person.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                      >
                        {(() => {
                          const logo = getPersonLogo(person);
                          return logo ? <img src={logo.url} alt={logo.alt} className="h-6 w-6 object-contain flex-shrink-0" /> : null;
                        })()}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold flex items-center gap-2 text-sm whitespace-nowrap">
                            {person.name}
                            {person.role === 'coach' && <span className="text-xs bg-muted px-2 py-0.5 rounded">Coach</span>}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <span>{context}</span>
                            {person.countries?.logo_url && (
                              <img 
                                src={person.countries.logo_url} 
                                alt={person.countries.name || ''} 
                                className="h-3.5 w-5 object-contain"
                                title={person.countries.name}
                              />
                            )}
                          </div>
                        </div>
                      </SwipeableFeedItem>
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