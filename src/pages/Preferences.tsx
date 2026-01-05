import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Search, X, ChevronRight, ChevronDown, ArrowLeft } from "lucide-react";
import dashboardBg from "@/assets/dashboard-bg.png";
import { useInvalidateUserPreferences } from "@/hooks/useUserPreferences";
import { useInvalidateArticleFeed } from "@/hooks/useArticleFeed";

type MenuItem = Database['public']['Tables']['preference_menu_items']['Row'];
type Team = Database['public']['Tables']['teams']['Row'];

export default function Preferences() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Menu structure
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);
  const [menuStack, setMenuStack] = useState<{ id: number | null; label: string }[]>([]);
  
  // Teams (for expanded leagues)
  const [teams, setTeams] = useState<Team[]>([]);
  const [expandedLeagueId, setExpandedLeagueId] = useState<number | null>(null);
  const [expandedLeagueTeamIds, setExpandedLeagueTeamIds] = useState<number[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  
  // Accordion expansion for inline parent items
  const [expandedAccordionIds, setExpandedAccordionIds] = useState<number[]>([]);
  
  // User selections
  const [selectedSports, setSelectedSports] = useState<number[]>([]);
  const [selectedLeagues, setSelectedLeagues] = useState<number[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  
  // Team search
  const [teamSearchTerm, setTeamSearchTerm] = useState("");
  const [allTeamsLoaded, setAllTeamsLoaded] = useState(false);
  const [loadingAllTeams, setLoadingAllTeams] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [leagueTeamMap, setLeagueTeamMap] = useState<Record<number, number[]>>({});
  const [leagueKinds, setLeagueKinds] = useState<Record<number, string>>({});
  const searchRef = useRef<HTMLDivElement>(null);
  
  const invalidatePreferences = useInvalidateUserPreferences();
  const invalidateFeed = useInvalidateArticleFeed();

  useEffect(() => {
    checkUser();
  }, []);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent body scroll when dropdown is open
  useEffect(() => {
    if (showSearchDropdown && teamSearchTerm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showSearchDropdown, teamSearchTerm]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);

    try {
      await supabase.rpc('ensure_my_subscriber');
    } catch (error) {
      console.error("Error ensuring subscriber:", error);
    }

    await loadPreferences();
  };

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load all menu items
      const { data: menuData, error: menuError } = await supabase
        .from("preference_menu_items")
        .select("*")
        .eq("is_visible", true)
        .order("app_order", { ascending: true });

      if (menuError) throw menuError;
      setMenuItems(menuData || []);

      // Load user's current interests
      const { data: interests, error: interestsError } = await supabase
        .from("subscriber_interests")
        .select("sport_id, league_id, team_id")
        .eq("subscriber_id", user.id);

      if (interestsError) throw interestsError;

      const sportIds = interests?.filter(i => i.sport_id !== null).map(i => i.sport_id as number) || [];
      const leagueIds = interests?.filter(i => i.league_id !== null).map(i => i.league_id as number) || [];
      const teamIds = interests?.filter(i => i.team_id !== null).map(i => i.team_id as number) || [];

      setSelectedSports(sportIds);
      setSelectedLeagues(leagueIds);
      setSelectedTeams(teamIds);

      // Load team_league_map for counting
      const allMappings: Array<{ league_id: number; team_id: number }> = [];
      const pageSize = 1000;
      for (let from = 0; ; from += pageSize) {
        const { data: page, error: pageError } = await supabase
          .from("team_league_map")
          .select("league_id, team_id")
          .order("id", { ascending: true })
          .range(from, from + pageSize - 1);

        if (pageError) throw pageError;
        if (!page || page.length === 0) break;
        allMappings.push(...page);
        if (page.length < pageSize) break;
      }

      if (allMappings.length > 0) {
        const mapping: Record<number, number[]> = {};
        allMappings.forEach((m) => {
          if (!mapping[m.league_id]) mapping[m.league_id] = [];
          mapping[m.league_id].push(m.team_id);
        });
        setLeagueTeamMap(mapping);
      }

      // Load league kinds to determine if Teams button should show
      const { data: leaguesData } = await supabase
        .from("leagues")
        .select("id, kind");
      
      if (leaguesData) {
        const kindsMap: Record<number, string> = {};
        leaguesData.forEach(l => {
          kindsMap[l.id] = l.kind;
        });
        setLeagueKinds(kindsMap);
      }

      // Load selected teams for display
      if (teamIds.length > 0) {
        const { data: selectedTeamsData } = await supabase
          .from("teams")
          .select("*")
          .in("id", teamIds);
        
        if (selectedTeamsData) {
          setTeams(selectedTeamsData);
        }
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
      toast.error("Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  const loadAllTeams = async () => {
    if (allTeamsLoaded) return;
    
    setLoadingAllTeams(true);
    try {
      const pageSize = 1000;
      let allTeamsData: Team[] = [];
      let page = 0;
      let hasMore = true;
      
      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data: teamsData, error: teamsError } = await supabase
          .from("teams")
          .select("*")
          .order("display_name", { ascending: true })
          .range(from, to);

        if (teamsError) throw teamsError;
        
        if (teamsData && teamsData.length > 0) {
          allTeamsData = [...allTeamsData, ...teamsData];
          hasMore = teamsData.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }
      
      setTeams(allTeamsData);
      setAllTeamsLoaded(true);
    } catch (error) {
      console.error("Error loading all teams:", error);
      toast.error("Failed to load teams");
    } finally {
      setLoadingAllTeams(false);
    }
  };

  const loadTeamsForLeague = async (leagueId: number) => {
    setLoadingTeams(true);
    try {
      // Get league info to determine team_type
      const { data: leagueData } = await supabase
        .from("leagues")
        .select("team_type")
        .eq("id", leagueId)
        .single();

      const teamType = leagueData?.team_type;
      let teamsData: any[] = [];

      if (teamType === 'country') {
        const { data: mappings, error } = await supabase
          .from("league_countries")
          .select("countries(*)")
          .eq("league_id", leagueId);
        if (error) throw error;
        teamsData = (mappings?.map(m => m.countries).filter(Boolean) || []).map(c => ({
          id: c.id,
          display_name: c.name,
          nickname: c.code,
          logo_url: c.logo_url,
          city_state_name: '',
        }));
      } else if (teamType === 'school') {
        const { data: mappings, error } = await supabase
          .from("league_schools")
          .select("schools(*)")
          .eq("league_id", leagueId);
        if (error) throw error;
        teamsData = (mappings?.map(m => m.schools).filter(Boolean) || []).map(s => ({
          id: s.id,
          display_name: s.name,
          nickname: s.short_name,
          logo_url: s.logo_url,
          city_state_name: '',
        }));
      } else {
        const { data: mappings, error } = await supabase
          .from("league_teams")
          .select("teams(*)")
          .eq("league_id", leagueId);
        if (error) throw error;
        teamsData = mappings?.map(m => m.teams).filter(Boolean) || [];
      }

      const teamIds = teamsData.map(t => Number(t.id));
      setExpandedLeagueTeamIds(teamIds);
      
      setTeams(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        const newTeams = teamsData.filter(t => t && !existingIds.has(t.id));
        return [...prev, ...newTeams].sort((a, b) => a.display_name.localeCompare(b.display_name));
      });
      
      setExpandedLeagueId(leagueId);
    } catch (error) {
      console.error("Error loading teams:", error);
      toast.error("Failed to load teams");
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleItemClick = async (item: MenuItem) => {
    // If it's a leaf node with an entity, toggle selection
    if (item.entity_type && item.entity_id) {
      if (item.entity_type === 'sport') {
        await handleSportToggle(item.entity_id, item.label);
      } else if (item.entity_type === 'league') {
        await handleLeagueToggle(item.entity_id, item.label);
      }
      return;
    }

    // If it's a submenu, navigate into it
    if (item.is_submenu) {
      setMenuStack(prev => [...prev, { id: currentParentId, label: item.label }]);
      setCurrentParentId(item.id);
      setExpandedLeagueId(null);
      return;
    }

    // Otherwise it might have inline children - this case is handled differently
  };

  const handleBack = () => {
    if (expandedLeagueId !== null) {
      setExpandedLeagueId(null);
      return;
    }
    
    if (menuStack.length > 0) {
      const prev = menuStack[menuStack.length - 1];
      setMenuStack(s => s.slice(0, -1));
      setCurrentParentId(prev.id);
    }
  };

  const handleSportToggle = async (sportId: number, label: string) => {
    const isCurrentlySelected = selectedSports.includes(sportId);

    try {
      if (isCurrentlySelected) {
        const { error } = await supabase
          .from("subscriber_interests")
          .delete()
          .eq("subscriber_id", userId)
          .eq("sport_id", sportId);
        if (error) throw error;
        setSelectedSports(prev => prev.filter(id => id !== sportId));
        toast(`Unfollowed ${label}`);
      } else {
        const { error } = await supabase
          .from("subscriber_interests")
          .insert({ subscriber_id: userId, sport_id: sportId });
        if (error) throw error;
        setSelectedSports(prev => [...prev, sportId]);
        toast.success(`Followed ${label}`);
      }
      
      if (userId) {
        invalidatePreferences(userId);
        invalidateFeed(userId);
      }
    } catch (error) {
      console.error("Error toggling sport:", error);
      toast.error("Could not update your preferences. Please try again.");
    }
  };

  const handleLeagueToggle = async (leagueId: number, label: string) => {
    const isCurrentlySelected = selectedLeagues.includes(leagueId);

    try {
      if (isCurrentlySelected) {
        const { error } = await supabase
          .from("subscriber_interests")
          .delete()
          .eq("subscriber_id", userId)
          .eq("league_id", leagueId);
        if (error) throw error;
        setSelectedLeagues(prev => prev.filter(id => id !== leagueId));
        toast(`Unfollowed ${label}`);
      } else {
        const { error } = await supabase
          .from("subscriber_interests")
          .insert({ subscriber_id: userId, league_id: leagueId });
        if (error) throw error;
        setSelectedLeagues(prev => [...prev, leagueId]);
        toast.success(`Followed ${label}`);
      }
      
      if (userId) {
        invalidatePreferences(userId);
        invalidateFeed(userId);
      }
    } catch (error) {
      console.error("Error toggling league:", error);
      toast.error("Could not update your preferences. Please try again.");
    }
  };

  const handleTeamToggle = async (teamId: number) => {
    const team = teams.find(t => t.id === teamId);
    const label = team?.display_name || 'team';
    const isCurrentlySelected = selectedTeams.includes(teamId);

    try {
      if (isCurrentlySelected) {
        const { error } = await supabase
          .from("subscriber_interests")
          .delete()
          .eq("subscriber_id", userId)
          .eq("team_id", teamId);
        if (error) throw error;
        setSelectedTeams(prev => prev.filter(id => id !== teamId));
        toast(`Unfollowed ${label}`);
      } else {
        const { error } = await supabase
          .from("subscriber_interests")
          .insert({ subscriber_id: userId, team_id: teamId });
        if (error) throw error;
        setSelectedTeams(prev => [...prev, teamId]);
        toast.success(`Followed ${label}`);
      }
      
      if (userId) {
        invalidatePreferences(userId);
        invalidateFeed(userId);
      }
    } catch (error) {
      console.error("Error toggling team:", error);
      toast.error("Could not update your preferences. Please try again.");
    }
  };

  const getCurrentMenuItems = () => {
    return menuItems.filter(item => item.parent_id === currentParentId);
  };

  const getSelectedTeamCountForLeague = (leagueId: number) => {
    const teamIdsForLeague = leagueTeamMap[leagueId] || [];
    return teamIdsForLeague.filter((teamId) => selectedTeams.includes(teamId)).length;
  };

  const getFilteredTeams = () => {
    if (!teamSearchTerm) return [];
    const searchLower = teamSearchTerm.toLowerCase();
    return teams
      .filter(team => 
        team.display_name.toLowerCase().includes(searchLower) ||
        team.nickname?.toLowerCase().includes(searchLower) ||
        team.city_state_name?.toLowerCase().includes(searchLower)
      )
      .sort((a, b) => a.display_name.localeCompare(b.display_name));
  };

  const getExpandedLeagueTeams = () => {
    if (!expandedLeagueId) return [];
    return teams
      .filter(t => expandedLeagueTeamIds.includes(Number(t.id)))
      .sort((a, b) => a.display_name.localeCompare(b.display_name));
  };

  const isItemSelected = (item: MenuItem) => {
    if (item.entity_type === 'sport' && item.entity_id) {
      return selectedSports.includes(item.entity_id);
    }
    if (item.entity_type === 'league' && item.entity_id) {
      return selectedLeagues.includes(item.entity_id);
    }
    return false;
  };

  const hasChildren = (item: MenuItem) => {
    return menuItems.some(m => m.parent_id === item.id);
  };

  const getChildItems = (parentId: number) => {
    return menuItems
      .filter(item => item.parent_id === parentId)
      .sort((a, b) => (a.app_order ?? 0) - (b.app_order ?? 0));
  };

  const toggleAccordion = (itemId: number) => {
    setExpandedAccordionIds(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const currentItems = getCurrentMenuItems();
  const currentLabel = menuStack.length > 0 ? menuStack[menuStack.length - 1].label : null;
  const expandedLeague = expandedLeagueId ? menuItems.find(m => m.entity_type === 'league' && m.entity_id === expandedLeagueId) : null;

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: `url(${dashboardBg})` }}
    >
      <header className="bg-transparent">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-black">
              <span className="font-racing text-2xl md:text-3xl">SportsDig</span> <span className="text-lg md:text-xl">- Sports/Teams Selector</span>
            </h1>
            <div className="flex gap-1.5 md:gap-2">
              <Button className="text-sm px-3 md:px-4" onClick={() => navigate("/")}>
                Dashboard
              </Button>
              <Button className="text-sm px-3 md:px-4" onClick={() => navigate("/my-feeds")}>
                My Selections
              </Button>
              {(menuStack.length > 0 || expandedLeagueId !== null) && (
                <Button className="text-sm px-3 md:px-4" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-2 max-w-3xl">
        <div className="bg-transparent border-none shadow-none">
          <div className="pb-2 pt-0 px-1">
            <p className="text-black font-bold text-sm">
              Select your sport and teams by clicking on them directly • {selectedSports.length} sports, {selectedLeagues.length} leagues, {selectedTeams.length} teams selected • Changes save automatically
            </p>
          </div>
          
          <div className="pt-2">
            {/* Team Search */}
            <div className="mb-4 relative" ref={searchRef}>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Search all teams..."
                    value={teamSearchTerm}
                    onChange={(e) => {
                      setTeamSearchTerm(e.target.value);
                      setShowSearchDropdown(true);
                      if (e.target.value && !allTeamsLoaded) {
                        loadAllTeams();
                      }
                    }}
                    onFocus={() => teamSearchTerm && setShowSearchDropdown(true)}
                    className="pr-8 bg-white"
                  />
                  {teamSearchTerm && (
                    <button
                      type="button"
                      onClick={() => { setTeamSearchTerm(""); setShowSearchDropdown(false); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button disabled={loadingAllTeams}>
                  {loadingAllTeams ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {showSearchDropdown && teamSearchTerm && (
                <div className="absolute z-10 left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg max-h-96 overflow-y-auto">
                  <h3 className="font-semibold text-sm text-muted-foreground p-2 border-b">Search Results</h3>
                  {loadingAllTeams ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : (
                    <>
                      {getFilteredTeams().map(team => {
                        const isSelected = selectedTeams.includes(Number(team.id));
                        return (
                          <div 
                            key={team.id} 
                            onClick={() => {
                              handleTeamToggle(Number(team.id));
                              setShowSearchDropdown(false);
                              setTeamSearchTerm("");
                            }}
                            className={`flex items-center gap-1.5 p-2 hover:bg-accent cursor-pointer border-b last:border-b-0 select-none ${
                              isSelected ? 'opacity-50' : ''
                            }`}
                          >
                            {team.logo_url && (
                              <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
                                <img 
                                  src={team.logo_url} 
                                  alt={team.display_name} 
                                  className="h-7 w-7 object-contain" 
                                  onError={(e) => e.currentTarget.style.display = 'none'}
                                />
                              </div>
                            )}
                            <span className="text-sm font-medium truncate flex-1 min-w-0">
                              {team.display_name}
                            </span>
                          </div>
                        );
                      })}
                      {getFilteredTeams().length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No teams found</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Teams view when league is expanded */}
            {expandedLeagueId !== null ? (
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-center">{expandedLeague?.label} Teams</h2>
                {loadingTeams ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {getExpandedLeagueTeams().map(team => {
                      const isSelected = selectedTeams.includes(Number(team.id));
                      return (
                        <div 
                          key={team.id} 
                          onClick={() => handleTeamToggle(Number(team.id))}
                          className={`flex items-center gap-1.5 p-1 rounded-lg cursor-pointer transition-colors border select-none ${
                            isSelected 
                              ? 'bg-blue-500 border-blue-600 text-white' 
                              : 'bg-card border-muted-foreground/40'
                          }`}
                        >
                          {team.logo_url && (
                            <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
                              <img 
                                src={team.logo_url} 
                                alt={team.display_name} 
                                className="h-7 w-7 object-contain" 
                                onError={(e) => e.currentTarget.style.display = 'none'}
                              />
                            </div>
                          )}
                          <span className="text-sm font-medium truncate flex-1 min-w-0">
                            {team.display_name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Menu items view */
              <div className="space-y-2">
                {currentLabel && (
                  <h2 className="text-xl font-bold text-center mb-4">{currentLabel}</h2>
                )}
                
                {currentItems.map((item) => {
                  const isSelected = isItemSelected(item);
                  const isLeague = item.entity_type === 'league';
                  const isSubmenu = item.is_submenu && hasChildren(item);
                  const isHeading = !item.entity_type && !item.is_submenu && !hasChildren(item);
                  const isAccordionParent = !item.is_submenu && hasChildren(item);
                  const isAccordionExpanded = expandedAccordionIds.includes(item.id);

                  // Non-clickable heading - render as plain text
                  if (isHeading) {
                    return (
                      <div key={item.id} className="pt-3 pb-1">
                        <h3 className="text-lg font-bold text-black select-none">
                          {item.label}
                        </h3>
                      </div>
                    );
                  }

                  return (
                    <div key={item.id}>
                      <div 
                        className={`flex items-center gap-1.5 py-0.5 px-1.5 rounded-lg border transition-colors select-none ${
                          isSelected 
                            ? 'bg-blue-500 border-blue-600 text-white' 
                            : 'bg-card border-muted-foreground/30'
                        }`}
                      >
                        <div 
                          onClick={() => handleItemClick(item)}
                          className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer"
                        >
                          {item.logo_url && (
                            <div className="flex items-center justify-center w-8 h-8 shrink-0">
                              <img 
                                src={item.logo_url} 
                                alt={item.label} 
                                className="h-7 w-7 object-contain" 
                                onError={(e) => e.currentTarget.style.display = 'none'}
                              />
                            </div>
                          )}
                          <span className="font-medium flex-1 min-w-0">
                            {item.label}
                          </span>
                          {isSubmenu && (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        
                        {/* Menu button for accordion parents */}
                        {isAccordionParent && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAccordion(item.id);
                            }}
                            className="shrink-0 transition-colors w-16 justify-center text-black h-7"
                          >
                            {isAccordionExpanded ? 'Close' : 'Menu'}
                          </Button>
                        )}
                        
                        {/* Teams button for leagues (only if kind is 'league', not 'topic') */}
                        {isLeague && item.entity_id && leagueKinds[item.entity_id] === 'league' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              loadTeamsForLeague(item.entity_id!);
                            }}
                            className="shrink-0 transition-colors w-20 justify-center text-black h-7"
                          >
                            Teams
                            {(() => {
                              const count = getSelectedTeamCountForLeague(item.entity_id!);
                              return count > 0 ? ` (${count})` : '';
                            })()}
                          </Button>
                        )}
                      </div>
                      
                      {/* Accordion children */}
                      {isAccordionParent && isAccordionExpanded && (
                        <div className="ml-4 mt-1 space-y-1 border-l-2 border-muted-foreground/20 pl-2">
                          {getChildItems(item.id).map((child) => {
                            const childIsSelected = isItemSelected(child);
                            const childIsLeague = child.entity_type === 'league';
                            const childHasChildren = hasChildren(child);
                            const childIsAccordionExpanded = expandedAccordionIds.includes(child.id);
                            
                            // Check if child is a heading with children (no entity_type but has children)
                            const childIsHeadingWithMenu = !child.entity_type && childHasChildren;
                            
                            return (
                              <div key={child.id}>
                                <div 
                                  className={`flex items-center gap-1.5 py-0.5 px-1.5 rounded-lg border transition-colors select-none ${
                                    childIsHeadingWithMenu ? '' : 'cursor-pointer'
                                  } ${
                                    childIsSelected 
                                      ? 'bg-blue-500 border-blue-600 text-white' 
                                      : 'bg-card border-muted-foreground/30'
                                  }`}
                                >
                                  <div 
                                    onClick={() => !childIsHeadingWithMenu && handleItemClick(child)}
                                    className={`flex items-center gap-1.5 flex-1 min-w-0 ${childIsHeadingWithMenu ? '' : 'cursor-pointer'}`}
                                  >
                                    {child.logo_url && (
                                      <div className="flex items-center justify-center w-8 h-8 shrink-0">
                                        <img 
                                          src={child.logo_url} 
                                          alt={child.label} 
                                          className="h-7 w-7 object-contain" 
                                          onError={(e) => e.currentTarget.style.display = 'none'}
                                        />
                                      </div>
                                    )}
                                    <span className={`font-medium flex-1 min-w-0 ${childIsHeadingWithMenu ? 'font-bold' : ''}`}>
                                      {child.label}
                                    </span>
                                  </div>
                                  
                                  {/* Menu button for nested accordion parents */}
                                  {childHasChildren && (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleAccordion(child.id);
                                      }}
                                      className="shrink-0 transition-colors w-16 justify-center text-black h-7"
                                    >
                                      {childIsAccordionExpanded ? 'Close' : 'Menu'}
                                    </Button>
                                  )}
                                  
                                  {/* Teams button for child leagues (only if kind is 'league', not 'topic') */}
                                  {childIsLeague && child.entity_id && leagueKinds[child.entity_id] === 'league' && (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        loadTeamsForLeague(child.entity_id!);
                                      }}
                                      className="shrink-0 transition-colors w-20 justify-center text-black h-7"
                                    >
                                      Teams
                                      {(() => {
                                        const count = getSelectedTeamCountForLeague(child.entity_id!);
                                        return count > 0 ? ` (${count})` : '';
                                      })()}
                                    </Button>
                                  )}
                                </div>
                                
                                {/* Nested accordion children (level 2) */}
                                {childHasChildren && childIsAccordionExpanded && (
                                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-muted-foreground/20 pl-2">
                                    {getChildItems(child.id).map((grandchild) => {
                                      const grandchildIsSelected = isItemSelected(grandchild);
                                      const grandchildIsLeague = grandchild.entity_type === 'league';
                                      
                                      return (
                                        <div 
                                          key={grandchild.id}
                                          onClick={() => handleItemClick(grandchild)}
                                          className={`flex items-center gap-1.5 py-0.5 px-1.5 rounded-lg border transition-colors select-none cursor-pointer ${
                                            grandchildIsSelected 
                                              ? 'bg-blue-500 border-blue-600 text-white' 
                                              : 'bg-card border-muted-foreground/30'
                                          }`}
                                        >
                                          {grandchild.logo_url && (
                                            <div className="flex items-center justify-center w-8 h-8 shrink-0">
                                              <img 
                                                src={grandchild.logo_url} 
                                                alt={grandchild.label} 
                                                className="h-7 w-7 object-contain" 
                                                onError={(e) => e.currentTarget.style.display = 'none'}
                                              />
                                            </div>
                                          )}
                                          <span className="font-medium flex-1 min-w-0">
                                            {grandchild.label}
                                          </span>
                                          
                                          {/* Teams button for grandchild leagues */}
                                          {grandchildIsLeague && grandchild.entity_id && leagueKinds[grandchild.entity_id] === 'league' && (
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                loadTeamsForLeague(grandchild.entity_id!);
                                              }}
                                              className="shrink-0 transition-colors w-20 justify-center text-black h-7"
                                            >
                                              Teams
                                              {(() => {
                                                const count = getSelectedTeamCountForLeague(grandchild.entity_id!);
                                                return count > 0 ? ` (${count})` : '';
                                              })()}
                                            </Button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {currentItems.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No items to display</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
