import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Search, X, ChevronRight, ChevronDown, ArrowLeft, Heart } from "lucide-react";
import { useUserPreferences, useInvalidateUserPreferences } from "@/hooks/useUserPreferences";
import { useInvalidateArticleFeed } from "@/hooks/useArticleFeed";
import FeedSelectionBand from "@/components/FeedSelectionBand";
import sportsdigLogo from "@/assets/sportsdig-blimp-logo.png";
import { searchPeople, PersonSearchResult } from "@/lib/searchPeople";

type MenuItem = Database['public']['Tables']['preference_menu_items']['Row'];
type Team = Database['public']['Tables']['teams']['Row'];
type School = Database['public']['Tables']['schools']['Row'];

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
  const [expandedLeagueItems, setExpandedLeagueItems] = useState<Array<{ id: number; display_name: string; nickname?: string; logo_url?: string | null }>>([]);
  const [expandedLeagueType, setExpandedLeagueType] = useState<'team' | 'school' | 'country'>('team');
  const [loadingTeams, setLoadingTeams] = useState(false);
  
  // Accordion expansion for inline parent items
  const [expandedAccordionIds, setExpandedAccordionIds] = useState<number[]>([]);
  
  // User selections
  const [selectedSports, setSelectedSports] = useState<number[]>([]);
  const [selectedLeagues, setSelectedLeagues] = useState<number[]>([]);
  const [selectedSchools, setSelectedSchools] = useState<number[]>([]);
  
  // Schools view
  const [schools, setSchools] = useState<School[]>([]);
  const [showSchoolsView, setShowSchoolsView] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  
  // Team & School search
  const [teamSearchTerm, setTeamSearchTerm] = useState("");
  const [allTeamsLoaded, setAllTeamsLoaded] = useState(false);
  const [allSchoolsLoaded, setAllSchoolsLoaded] = useState(false);
  const [loadingAllTeams, setLoadingAllTeams] = useState(false);
  const [loadingAllSchoolsSearch, setLoadingAllSchoolsSearch] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [leagueTeamMap, setLeagueTeamMap] = useState<Record<number, number[]>>({});
  const [leagueSchoolMap, setLeagueSchoolMap] = useState<Record<number, number[]>>({});
  const [selectedSchoolsByLeague, setSelectedSchoolsByLeague] = useState<Record<number, number[]>>({});
  const [allSportsSchools, setAllSportsSchools] = useState<Set<number>>(new Set());
  const [leagueKinds, setLeagueKinds] = useState<Record<number, string>>({});
  const searchRef = useRef<HTMLDivElement>(null);
  
  // People search
  const [peopleSearchResults, setPeopleSearchResults] = useState<PersonSearchResult[]>([]);
  const [searchingPeople, setSearchingPeople] = useState(false);
  const [followedPersonIds, setFollowedPersonIds] = useState<Set<number>>(new Set());
  
  const invalidatePreferences = useInvalidateUserPreferences();
  const invalidateFeed = useInvalidateArticleFeed();
  
  // Fetch user preferences for the selection band
  const { data: userPreferences } = useUserPreferences(userId);

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

      // Load user's current interests (exclude Olympics preferences)
      const { data: interests, error: interestsError } = await supabase
        .from("subscriber_interests")
        .select("sport_id, league_id, team_id, school_id, country_id, person_id, is_olympics")
        .eq("subscriber_id", user.id);

      if (interestsError) throw interestsError;
      
      // Filter out Olympics preferences - they're managed separately on /olympics
      const nonOlympicsInterests = (interests || []).filter(i => !i.is_olympics);

      const sportIds = nonOlympicsInterests.filter(i => i.sport_id !== null).map(i => i.sport_id as number);
      // Only count as a league selection if league_id is set but no team/school/country is set (direct league follow)
      const leagueIds = nonOlympicsInterests.filter(i => i.league_id !== null && i.team_id === null && i.school_id === null && i.country_id === null).map(i => i.league_id as number);
      const teamIds = nonOlympicsInterests.filter(i => i.team_id !== null).map(i => i.team_id as number);
      const schoolIds = nonOlympicsInterests.filter(i => i.school_id !== null).map(i => i.school_id as number);
      const personIds = nonOlympicsInterests.filter(i => i.person_id !== null).map(i => i.person_id as number);
      
      // Populate followed person IDs for greying out in search
      setFollowedPersonIds(new Set(personIds));
      
      // Track schools selected with a league context (for counting on Teams button)
      const schoolsByLeagueMap: Record<number, number[]> = {};
      nonOlympicsInterests.filter(i => i.school_id !== null && i.league_id !== null).forEach(i => {
        const leagueId = i.league_id as number;
        const schoolId = i.school_id as number;
        if (!schoolsByLeagueMap[leagueId]) schoolsByLeagueMap[leagueId] = [];
        schoolsByLeagueMap[leagueId].push(schoolId);
      });
      setSelectedSchoolsByLeague(schoolsByLeagueMap);
      
      // Track schools with "All Sports" selection (school_id with NO league_id)
      const allSportsSchoolIds = nonOlympicsInterests
        .filter(i => i.school_id !== null && i.league_id === null)
        .map(i => i.school_id as number);
      setAllSportsSchools(new Set(allSportsSchoolIds));

      setSelectedSports(sportIds);
      setSelectedLeagues(leagueIds);
      setSelectedSchools(schoolIds);
      setSelectedTeams(teamIds);

      // Load league_teams for counting
      const allMappings: Array<{ league_id: number; team_id: number }> = [];
      const pageSize = 1000;
      for (let from = 0; ; from += pageSize) {
        const { data: page, error: pageError } = await supabase
          .from("league_teams")
          .select("league_id, team_id")
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

  const loadAllTeamsAndSchools = async () => {
    // Load teams if not already loaded
    if (!allTeamsLoaded) {
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
    }
    
    // Load schools if not already loaded
    if (!allSchoolsLoaded) {
      setLoadingAllSchoolsSearch(true);
      try {
        const { data: schoolsData, error } = await supabase
          .from("schools")
          .select("*")
          .order("name", { ascending: true });
        
        if (error) throw error;
        setSchools(schoolsData || []);
        setAllSchoolsLoaded(true);
      } catch (error) {
        console.error("Error loading all schools:", error);
        toast.error("Failed to load schools");
      } finally {
        setLoadingAllSchoolsSearch(false);
      }
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
      let itemsData: Array<{ id: number; display_name: string; nickname?: string; logo_url?: string | null }> = [];
      let resolvedType: 'team' | 'school' | 'country' = 'team';

      if (teamType === 'country') {
        resolvedType = 'country';
        const { data: mappings, error } = await supabase
          .from("league_countries")
          .select("countries(*)")
          .eq("league_id", leagueId);
        if (error) throw error;
        itemsData = (mappings?.map(m => m.countries).filter(Boolean) || []).map(c => ({
          id: c.id,
          display_name: c.name,
          nickname: c.code,
          logo_url: c.logo_url,
        }));
      } else if (teamType === 'school') {
        resolvedType = 'school';
        const { data: mappings, error } = await supabase
          .from("league_schools")
          .select("schools(*)")
          .eq("league_id", leagueId);
        if (error) throw error;
        itemsData = (mappings?.map(m => m.schools).filter(Boolean) || []).map(s => ({
          id: s.id,
          display_name: s.name,
          nickname: s.short_name,
          logo_url: s.logo_url,
        }));
      } else {
        resolvedType = 'team';
        const { data: mappings, error } = await supabase
          .from("league_teams")
          .select("teams(*)")
          .eq("league_id", leagueId);
        if (error) throw error;
        itemsData = (mappings?.map(m => m.teams).filter(Boolean) || []).map(t => ({
          id: t.id,
          display_name: t.display_name,
          nickname: t.nickname,
          logo_url: t.logo_url,
        }));
      }

      // Sort alphabetically
      itemsData.sort((a, b) => a.display_name.localeCompare(b.display_name));

      setExpandedLeagueItems(itemsData);
      setExpandedLeagueType(resolvedType);
      setExpandedLeagueTeamIds(itemsData.map(t => t.id));
      setExpandedLeagueId(leagueId);
    } catch (error) {
      console.error("Error loading teams:", error);
      toast.error("Failed to load teams");
    } finally {
      setLoadingTeams(false);
    }
  };

  const loadAllSchools = async () => {
    setLoadingSchools(true);
    try {
      const { data: schoolsData, error } = await supabase
        .from("schools")
        .select("*")
        .order("name", { ascending: true });
      
      if (error) throw error;
      setSchools(schoolsData || []);
      setShowSchoolsView(true);
    } catch (error) {
      console.error("Error loading schools:", error);
      toast.error("Failed to load schools");
    } finally {
      setLoadingSchools(false);
    }
  };

  const handleSchoolToggle = async (schoolId: number, leagueId?: number | null) => {
    const expandedItem = expandedLeagueItems.find(i => i.id === schoolId);
    const schoolItem = schools.find(s => s.id === schoolId);
    const label = expandedItem?.display_name || schoolItem?.name || 'school';
    const isCurrentlySelected = selectedSchools.includes(schoolId);

    try {
      if (isCurrentlySelected) {
        const { error } = await supabase
          .from("subscriber_interests")
          .delete()
          .eq("subscriber_id", userId)
          .eq("school_id", schoolId);
        if (error) throw error;
        setSelectedSchools(prev => prev.filter(id => id !== schoolId));
        // Also remove from selectedSchoolsByLeague if it was in a league context
        if (leagueId) {
          setSelectedSchoolsByLeague(prev => ({
            ...prev,
            [leagueId]: (prev[leagueId] || []).filter(id => id !== schoolId)
          }));
        }
        toast(`Unfollowed ${label}`);
      } else {
        // If we have a league context, save both school_id and league_id
        const insertData: { subscriber_id: string | null; school_id: number; league_id?: number } = { 
          subscriber_id: userId, 
          school_id: schoolId 
        };
        if (leagueId) {
          insertData.league_id = leagueId;
        }
        const { error } = await supabase
          .from("subscriber_interests")
          .insert(insertData);
        if (error) throw error;
        setSelectedSchools(prev => [...prev, schoolId]);
        // Also add to selectedSchoolsByLeague if it's in a league context
        if (leagueId) {
          setSelectedSchoolsByLeague(prev => ({
            ...prev,
            [leagueId]: [...(prev[leagueId] || []), schoolId]
          }));
        }
        toast.success(`Followed ${label}`);
      }
      
      if (userId) {
        invalidatePreferences(userId);
        invalidateFeed(userId);
      }
    } catch (error) {
      console.error("Error toggling school:", error);
      toast.error("Could not update your preferences. Please try again.");
    }
  };

  // Navigate to focused feed for an entity - no need to create a favorite
  const handleNavigateToFocus = (entityType: 'sport' | 'league' | 'team' | 'school' | 'person', entityId: number) => {
    navigate(`/feed?type=${entityType}&id=${entityId}`);
  };

  const handleItemClick = async (item: MenuItem) => {
    // Check for custom route in display_options first
    const displayOptions = item.display_options as { route?: string } | null;
    if (displayOptions?.route) {
      navigate(displayOptions.route);
      return;
    }

    // If it's a leaf node with an entity, navigate to focused feed
    if (item.entity_type && item.entity_id) {
      if (item.entity_type === 'sport') {
        await handleNavigateToFocus('sport', item.entity_id);
      } else if (item.entity_type === 'league') {
        await handleNavigateToFocus('league', item.entity_id);
      }
      return;
    }
    
    // If entity_type is 'schools' (no entity_id), it's a schools browser
    if (item.entity_type === 'schools') {
      loadAllSchools();
      return;
    }

    // If it's a submenu, navigate into it
    if (item.is_submenu) {
      setMenuStack(prev => [...prev, { id: currentParentId, label: item.label }]);
      setCurrentParentId(item.id);
      setExpandedLeagueId(null);
      setShowSchoolsView(false);
      return;
    }

    // Otherwise it might have inline children - this case is handled differently
  };

  const handleBack = () => {
    if (expandedLeagueId !== null) {
      setExpandedLeagueId(null);
      return;
    }
    
    if (showSchoolsView) {
      setShowSchoolsView(false);
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
    // For school-type leagues, count selected schools within that league context
    const schoolsForLeague = selectedSchoolsByLeague[leagueId] || [];
    if (schoolsForLeague.length > 0) {
      return schoolsForLeague.length;
    }
    // For team-type leagues, count selected teams
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

  const getFilteredSchools = () => {
    if (!teamSearchTerm) return [];
    const searchLower = teamSearchTerm.toLowerCase();
    return schools
      .filter(school => 
        school.name.toLowerCase().includes(searchLower) ||
        school.short_name?.toLowerCase().includes(searchLower) ||
        school.aliases?.some(alias => alias.toLowerCase().includes(searchLower))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Debounced people search
  useEffect(() => {
    if (!teamSearchTerm || teamSearchTerm.length < 2) {
      setPeopleSearchResults([]);
      return;
    }
    
    const timer = setTimeout(async () => {
      setSearchingPeople(true);
      try {
        const results = await searchPeople(teamSearchTerm);
        // Don't filter out followed people - they'll show greyed out instead
        setPeopleSearchResults(results.slice(0, 10)); // Limit to 10 results
      } catch (error) {
        console.error("Error searching people:", error);
      } finally {
        setSearchingPeople(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [teamSearchTerm, followedPersonIds]);

  // Load followed person IDs from preferences
  useEffect(() => {
    if (userPreferences?.people) {
      setFollowedPersonIds(new Set(userPreferences.people.map(p => p.id)));
    }
  }, [userPreferences?.people]);

  const getFilteredSportsAndLeagues = useCallback(() => {
    if (!teamSearchTerm) return { sports: [] as MenuItem[], leagues: [] as MenuItem[] };
    const searchLower = teamSearchTerm.toLowerCase();
    
    const sports = menuItems.filter(item => 
      item.entity_type === 'sport' && 
      item.label.toLowerCase().includes(searchLower)
    );
    
    const leagues = menuItems.filter(item => 
      item.entity_type === 'league' && 
      item.label.toLowerCase().includes(searchLower)
    );
    
    return { sports, leagues };
  }, [teamSearchTerm, menuItems]);

  const handlePersonFollow = async (person: PersonSearchResult) => {
    if (!userId) return;
    
    try {
      const { error } = await supabase.from("subscriber_interests").insert({
        subscriber_id: userId,
        person_id: person.id,
        notification_enabled: true,
        priority: 1
      });
      
      if (error) throw error;
      
      toast.success(`Now following ${person.name}`);
      setFollowedPersonIds(prev => new Set([...prev, person.id]));
      setPeopleSearchResults(prev => prev.filter(p => p.id !== person.id));
      setShowSearchDropdown(false);
      setTeamSearchTerm("");
      
      invalidatePreferences(userId);
      invalidateFeed(userId);
    } catch (error) {
      console.error("Error following person:", error);
      toast.error("Failed to follow. Please try again.");
    }
  };

  // Delete handlers for FeedSelectionBand (delete-only, no toggle)
  const handleDeleteSport = async (sportId: number) => {
    if (!userId) return;
    try {
      const sport = userPreferences?.sports.find(s => s.id === sportId);
      const { error } = await supabase
        .from("subscriber_interests")
        .delete()
        .eq("subscriber_id", userId)
        .eq("sport_id", sportId);
      if (error) throw error;
      setSelectedSports(prev => prev.filter(id => id !== sportId));
      toast(`Unfollowed ${sport?.display_label || sport?.sport || 'sport'}`);
      invalidatePreferences(userId);
      invalidateFeed(userId);
    } catch (error) {
      console.error("Error deleting sport:", error);
      toast.error("Could not remove. Please try again.");
    }
  };

  const handleDeleteLeague = async (leagueId: number) => {
    if (!userId) return;
    try {
      const league = userPreferences?.leagues.find(l => l.id === leagueId);
      const { error } = await supabase
        .from("subscriber_interests")
        .delete()
        .eq("subscriber_id", userId)
        .eq("league_id", leagueId);
      if (error) throw error;
      setSelectedLeagues(prev => prev.filter(id => id !== leagueId));
      toast(`Unfollowed ${league?.name || 'league'}`);
      invalidatePreferences(userId);
      invalidateFeed(userId);
    } catch (error) {
      console.error("Error deleting league:", error);
      toast.error("Could not remove. Please try again.");
    }
  };

  const handleDeleteTeam = async (teamId: number) => {
    if (!userId) return;
    try {
      const team = userPreferences?.teams.find(t => t.id === teamId);
      const { error } = await supabase
        .from("subscriber_interests")
        .delete()
        .eq("subscriber_id", userId)
        .eq("team_id", teamId);
      if (error) throw error;
      setSelectedTeams(prev => prev.filter(id => id !== teamId));
      toast(`Unfollowed ${team?.display_name || 'team'}`);
      invalidatePreferences(userId);
      invalidateFeed(userId);
    } catch (error) {
      console.error("Error deleting team:", error);
      toast.error("Could not remove. Please try again.");
    }
  };

  const handleDeleteSchool = async (schoolId: number, leagueId?: number) => {
    if (!userId) return;
    try {
      const school = userPreferences?.schools.find(s => s.id === schoolId);
      let query = supabase
        .from("subscriber_interests")
        .delete()
        .eq("subscriber_id", userId)
        .eq("school_id", schoolId);
      
      // If leagueId is provided, also match on league_id for compound interests
      if (leagueId) {
        query = query.eq("league_id", leagueId);
      }
      
      const { error } = await query;
      if (error) throw error;
      
      // Update local state
      if (leagueId) {
        setSelectedSchoolsByLeague(prev => {
          const updated = { ...prev };
          if (updated[leagueId]) {
            updated[leagueId] = updated[leagueId].filter(id => id !== schoolId);
          }
          return updated;
        });
      } else {
        // All sports school
        setAllSportsSchools(prev => {
          const updated = new Set(prev);
          updated.delete(schoolId);
          return updated;
        });
      }
      
      toast(`Unfollowed ${school?.short_name || 'school'}`);
      invalidatePreferences(userId);
      invalidateFeed(userId);
    } catch (error) {
      console.error("Error deleting school:", error);
      toast.error("Could not remove. Please try again.");
    }
  };

  const handleDeletePerson = async (personId: number) => {
    if (!userId) return;
    try {
      const person = userPreferences?.people.find(p => p.id === personId);
      const { error } = await supabase
        .from("subscriber_interests")
        .delete()
        .eq("subscriber_id", userId)
        .eq("person_id", personId);
      if (error) throw error;
      setFollowedPersonIds(prev => {
        const updated = new Set(prev);
        updated.delete(personId);
        return updated;
      });
      toast(`Unfollowed ${person?.name || 'person'}`);
      invalidatePreferences(userId);
      invalidateFeed(userId);
    } catch (error) {
      console.error("Error deleting person:", error);
      toast.error("Could not remove. Please try again.");
    }
  };

  const handleDeleteOlympics = async (interestId: number) => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from("subscriber_interests")
        .delete()
        .eq("id", interestId);
      if (error) throw error;
      toast(`Removed Olympics preference`);
      invalidatePreferences(userId);
      invalidateFeed(userId);
    } catch (error) {
      console.error("Error deleting Olympics preference:", error);
      toast.error("Could not remove. Please try again.");
    }
  };

  const getExpandedLeagueTeams = () => {
    if (!expandedLeagueId) return [];
    return expandedLeagueItems;
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
      className="min-h-screen bg-[#D5D5D5]"
    >
      <header className="bg-transparent">
        <div className="container mx-auto px-4 py-4 max-w-3xl">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-4">
              <img 
                src={sportsdigLogo} 
                alt="SportsDig Logo" 
                className="h-16 md:h-20"
              />
              <span className="text-lg md:text-xl font-bold text-black">Sports/Teams Selector</span>
            </div>
            <div className="flex gap-1.5 md:gap-2">
              <Button className="text-sm px-3 md:px-4" onClick={() => navigate("/")}>
                Dashboard
              </Button>
              <Button className="text-sm px-3 md:px-4" onClick={() => navigate("/feed")}>
                Combined Feed
              </Button>
              {(menuStack.length > 0 || expandedLeagueId !== null || showSchoolsView) && (
                <Button className="text-sm px-3 md:px-4" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
            </div>
          </div>
          
          {/* Horizontal scrolling selection band - left aligned */}
          {userPreferences && (
            <div className="mt-3">
              <FeedSelectionBand
                sports={userPreferences.sports}
                leagues={userPreferences.leagues}
                teams={userPreferences.teams}
                schools={userPreferences.schools}
                people={userPreferences.people}
                olympicsPrefs={userPreferences.olympicsPrefs}
                onDeleteSport={handleDeleteSport}
                onDeleteLeague={handleDeleteLeague}
                onDeleteTeam={handleDeleteTeam}
                onDeleteSchool={handleDeleteSchool}
                onDeletePerson={handleDeletePerson}
                onDeleteOlympics={handleDeleteOlympics}
              />
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 pt-0 pb-2 max-w-3xl">
        <div className="bg-transparent border-none shadow-none">
          <div className="pt-2">
            {/* Backdrop blur overlay when dropdown is open - placed outside search container */}
            {showSearchDropdown && teamSearchTerm && (
              <div 
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[5]"
                onClick={() => setShowSearchDropdown(false)}
              />
            )}
            
            {/* Universal Search */}
            <div className={`mb-4 relative ${showSearchDropdown && teamSearchTerm ? 'z-[6]' : ''}`} ref={searchRef}>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Search teams, players, sports, leagues..."
                    value={teamSearchTerm}
                    onChange={(e) => {
                      setTeamSearchTerm(e.target.value);
                      setShowSearchDropdown(true);
                      if (e.target.value && (!allTeamsLoaded || !allSchoolsLoaded)) {
                        loadAllTeamsAndSchools();
                      }
                    }}
                    onFocus={() => teamSearchTerm && setShowSearchDropdown(true)}
                    className="pr-8 bg-white"
                  />
                  {teamSearchTerm && (
                    <button
                      type="button"
                      onClick={() => { setTeamSearchTerm(""); setShowSearchDropdown(false); setPeopleSearchResults([]); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button disabled={loadingAllTeams || loadingAllSchoolsSearch || searchingPeople}>
                  {(loadingAllTeams || loadingAllSchoolsSearch || searchingPeople) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {showSearchDropdown && teamSearchTerm && (
                <div className="absolute z-10 left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg max-h-96 overflow-y-auto">
                  {(loadingAllTeams || loadingAllSchoolsSearch) ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : (
                    <>
                      {/* Sports Section */}
                      {getFilteredSportsAndLeagues().sports.length > 0 && (
                        <>
                          <h3 className="font-semibold text-sm text-muted-foreground p-2 border-b bg-muted/50">Sports</h3>
                          {getFilteredSportsAndLeagues().sports.slice(0, 10).map(item => {
                            const isSelected = item.entity_id ? selectedSports.includes(item.entity_id) : false;
                            return (
                              <div 
                                key={`sport-${item.id}`} 
                                className="flex items-center gap-1.5 p-2 hover:bg-accent border-b last:border-b-0 select-none"
                              >
                                {item.logo_url && (
                                  <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
                                    <img 
                                      src={item.logo_url} 
                                      alt={item.label} 
                                      className="h-7 w-7 object-contain" 
                                      onError={(e) => e.currentTarget.style.display = 'none'}
                                    />
                                  </div>
                                )}
                                <span 
                                  onClick={() => {
                                    if (item.entity_id) {
                                      handleNavigateToFocus('sport', item.entity_id);
                                    }
                                    setShowSearchDropdown(false);
                                    setTeamSearchTerm("");
                                  }}
                                  className="text-sm font-medium truncate flex-1 min-w-0 cursor-pointer"
                                >
                                  {item.label}
                                </span>
                                <Heart 
                                  className={`h-5 w-5 cursor-pointer flex-shrink-0 ${
                                    isSelected 
                                      ? 'fill-red-500 text-red-500' 
                                      : 'text-muted-foreground hover:text-red-500'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (item.entity_id) {
                                      handleSportToggle(item.entity_id, item.label);
                                    }
                                  }}
                                />
                              </div>
                            );
                          })}
                        </>
                      )}
                      
                      {/* Leagues Section */}
                      {getFilteredSportsAndLeagues().leagues.length > 0 && (
                        <>
                          <h3 className="font-semibold text-sm text-muted-foreground p-2 border-b bg-muted/50">Leagues</h3>
                          {getFilteredSportsAndLeagues().leagues.slice(0, 10).map(item => {
                            const isSelected = item.entity_id ? selectedLeagues.includes(item.entity_id) : false;
                            return (
                              <div 
                                key={`league-${item.id}`} 
                                className="flex items-center gap-1.5 p-2 hover:bg-accent border-b last:border-b-0 select-none"
                              >
                                {item.logo_url && (
                                  <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
                                    <img 
                                      src={item.logo_url} 
                                      alt={item.label} 
                                      className="h-7 w-7 object-contain" 
                                      onError={(e) => e.currentTarget.style.display = 'none'}
                                    />
                                  </div>
                                )}
                                <span 
                                  onClick={() => {
                                    if (item.entity_id) {
                                      handleNavigateToFocus('league', item.entity_id);
                                    }
                                    setShowSearchDropdown(false);
                                    setTeamSearchTerm("");
                                  }}
                                  className="text-sm font-medium truncate flex-1 min-w-0 cursor-pointer"
                                >
                                  {item.label}
                                </span>
                                <Heart 
                                  className={`h-5 w-5 cursor-pointer flex-shrink-0 ${
                                    isSelected 
                                      ? 'fill-red-500 text-red-500' 
                                      : 'text-muted-foreground hover:text-red-500'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (item.entity_id) {
                                      handleLeagueToggle(item.entity_id, item.label);
                                    }
                                  }}
                                />
                              </div>
                            );
                          })}
                        </>
                      )}
                      
                      {/* Teams Section */}
                      {getFilteredTeams().length > 0 && (
                        <>
                          <h3 className="font-semibold text-sm text-muted-foreground p-2 border-b bg-muted/50">Teams</h3>
                          {getFilteredTeams().slice(0, 15).map(team => {
                            const isSelected = selectedTeams.includes(Number(team.id));
                            return (
                              <div 
                                key={`team-${team.id}`} 
                                className="flex items-center gap-1.5 p-2 hover:bg-accent border-b last:border-b-0 select-none"
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
                                <span 
                                  onClick={() => {
                                    handleNavigateToFocus('team', Number(team.id));
                                    setShowSearchDropdown(false);
                                    setTeamSearchTerm("");
                                  }}
                                  className="text-sm font-medium truncate flex-1 min-w-0 cursor-pointer"
                                >
                                  {team.display_name}
                                </span>
                                <Heart 
                                  className={`h-5 w-5 cursor-pointer flex-shrink-0 ${
                                    isSelected 
                                      ? 'fill-red-500 text-red-500' 
                                      : 'text-muted-foreground hover:text-red-500'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTeamToggle(Number(team.id));
                                  }}
                                />
                              </div>
                            );
                          })}
                        </>
                      )}
                      
                      {/* Schools Section */}
                      {getFilteredSchools().length > 0 && (
                        <>
                          <h3 className="font-semibold text-sm text-muted-foreground p-2 border-b bg-muted/50">Schools</h3>
                          {getFilteredSchools().slice(0, 15).map(school => {
                            // Selected if "All Sports" is selected OR any interest exists for this school
                            const isSelected = allSportsSchools.has(school.id) || selectedSchools.includes(school.id);
                            return (
                              <div 
                                key={`school-${school.id}`} 
                                className="flex items-center gap-1.5 p-2 hover:bg-accent border-b last:border-b-0 select-none"
                              >
                                {school.logo_url && (
                                  <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
                                    <img 
                                      src={school.logo_url} 
                                      alt={school.name} 
                                      className="h-7 w-7 object-contain" 
                                      onError={(e) => e.currentTarget.style.display = 'none'}
                                    />
                                  </div>
                                )}
                                <span 
                                  onClick={() => {
                                    handleNavigateToFocus('school', school.id);
                                    setShowSearchDropdown(false);
                                    setTeamSearchTerm("");
                                  }}
                                  className="text-sm font-medium truncate flex-1 min-w-0 cursor-pointer"
                                >
                                  {school.name}
                                </span>
                                <div 
                                  className="relative flex-shrink-0 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSchoolToggle(school.id);
                                  }}
                                >
                                  <Heart 
                                    className={`h-5 w-5 ${
                                      isSelected 
                                        ? 'fill-red-500 text-red-500' 
                                        : 'text-muted-foreground hover:text-red-500'
                                    }`}
                                  />
                                  {allSportsSchools.has(school.id) && (
                                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">
                                      A
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                      
                      {/* Players & Coaches Section */}
                      {peopleSearchResults.length > 0 && (
                        <>
                          <h3 className="font-semibold text-sm text-muted-foreground p-2 border-b bg-muted/50">Players & Coaches</h3>
                          {searchingPeople ? (
                            <div className="flex items-center justify-center py-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          ) : (
                            peopleSearchResults.map(person => {
                              const logoUrl = person.teams?.logo_url || person.schools?.logo_url || person.leagues?.logo_url || person.sports?.logo_url;
                              const isFollowed = followedPersonIds.has(person.id);
                              return (
                                <div 
                                  key={`person-${person.id}`} 
                                  className="flex items-center gap-1.5 p-2 hover:bg-accent border-b last:border-b-0 select-none"
                                >
                                  {logoUrl && (
                                    <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
                                      <img 
                                        src={logoUrl} 
                                        alt={person.name} 
                                        className="h-7 w-7 object-contain" 
                                        onError={(e) => e.currentTarget.style.display = 'none'}
                                      />
                                    </div>
                                  )}
                                  <div 
                                    onClick={() => {
                                      handleNavigateToFocus('person', person.id);
                                      setShowSearchDropdown(false);
                                      setTeamSearchTerm("");
                                    }}
                                    className="flex flex-col min-w-0 flex-1 cursor-pointer"
                                  >
                                    <span className="text-sm font-medium truncate flex items-center gap-1.5">
                                      {person.name}
                                      {person.countries?.logo_url && (
                                        <img 
                                          src={person.countries.logo_url} 
                                          alt={person.countries.name} 
                                          className="h-4 w-5 object-contain flex-shrink-0"
                                        />
                                      )}
                                    </span>
                                    <span className="text-xs text-muted-foreground truncate">
                                      {[
                                        person.teams?.display_name || person.schools?.short_name,
                                        person.position,
                                        person.role === 'coach' ? 'Coach' : null
                                      ].filter(Boolean).join(' • ')}
                                    </span>
                                  </div>
                                  <Heart 
                                    className={`h-5 w-5 cursor-pointer flex-shrink-0 ${
                                      isFollowed 
                                        ? 'fill-red-500 text-red-500' 
                                        : 'text-muted-foreground hover:text-red-500'
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!isFollowed) {
                                        handlePersonFollow(person);
                                      }
                                    }}
                                  />
                                </div>
                              );
                            })
                          )}
                        </>
                      )}
                      
                      {getFilteredSportsAndLeagues().sports.length === 0 && 
                       getFilteredSportsAndLeagues().leagues.length === 0 && 
                       getFilteredTeams().length === 0 && 
                       getFilteredSchools().length === 0 && 
                       peopleSearchResults.length === 0 && 
                       !searchingPeople && (
                        <p className="text-sm text-muted-foreground text-center py-4">No results found</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Schools view */}
            {showSchoolsView ? (
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-center">Schools</h2>
                {loadingSchools ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {schools.map(school => {
                      // In the Schools browser (All Sports context), selected if any interest exists
                      const isSelected = allSportsSchools.has(school.id) || selectedSchools.includes(school.id);
                      return (
                        <div 
                          key={school.id} 
                          className="flex items-center gap-1.5 p-1 rounded-lg transition-colors border select-none bg-card border-muted-foreground/40"
                        >
                          <div 
                            onClick={() => handleNavigateToFocus('school', school.id)}
                            className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer"
                          >
                            {school.logo_url && (
                              <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
                                <img 
                                  src={school.logo_url} 
                                  alt={school.name} 
                                  className="h-7 w-7 object-contain" 
                                  onError={(e) => e.currentTarget.style.display = 'none'}
                                />
                              </div>
                            )}
                            <span className="text-sm font-medium truncate flex-1 min-w-0">
                              {school.name}
                            </span>
                          </div>
                          
                          {/* Heart toggle for favoriting schools */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSchoolToggle(school.id);
                            }}
                            className="shrink-0 p-1 rounded-md hover:bg-muted/50 transition-colors relative"
                            title={isSelected ? "Remove from favorites" : "Add to favorites"}
                          >
                            <Heart 
                              className={`h-5 w-5 ${isSelected ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
                            />
                            {allSportsSchools.has(school.id) && (
                              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">
                                A
                              </span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : expandedLeagueId !== null ? (
              /* Teams/Schools/Countries view when league is expanded */
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-center">
                  {expandedLeague?.label} {expandedLeagueType === 'school' ? 'Schools' : expandedLeagueType === 'country' ? 'Countries' : 'Teams'}
                </h2>
                {loadingTeams ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {getExpandedLeagueTeams().map(item => {
                      // For schools: selected if "All Sports" is selected OR this specific combo exists
                      const isSelected = expandedLeagueType === 'school' 
                        ? (allSportsSchools.has(item.id) || selectedSchools.includes(item.id))
                        : selectedTeams.includes(item.id);
                      return (
                        <div 
                          key={item.id} 
                          className="flex items-center gap-1.5 p-1 rounded-lg transition-colors border select-none bg-card border-muted-foreground/40"
                        >
                          <div 
                            onClick={() => handleNavigateToFocus(
                              expandedLeagueType === 'school' ? 'school' : 'team', 
                              item.id
                            )}
                            className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer"
                          >
                            {item.logo_url && (
                              <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
                                <img 
                                  src={item.logo_url} 
                                  alt={item.display_name} 
                                  className="h-7 w-7 object-contain" 
                                  onError={(e) => e.currentTarget.style.display = 'none'}
                                />
                              </div>
                            )}
                            <span className="text-sm font-medium truncate flex-1 min-w-0">
                              {item.display_name}
                            </span>
                          </div>
                          
                          {/* Heart toggle for favoriting teams/schools */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (expandedLeagueType === 'school') {
                                handleSchoolToggle(item.id, expandedLeagueId);
                              } else {
                                handleTeamToggle(item.id);
                              }
                            }}
                            className="shrink-0 p-1 rounded-md hover:bg-muted/50 transition-colors relative"
                            title={isSelected ? "Remove from favorites" : "Add to favorites"}
                          >
                            <Heart 
                              className={`h-5 w-5 ${isSelected ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
                            />
                            {expandedLeagueType === 'school' && allSportsSchools.has(item.id) && (
                              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">
                                A
                              </span>
                            )}
                          </button>
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
                  const isSchools = item.entity_type === 'schools';
                  const isSubmenu = item.is_submenu && hasChildren(item);
                  const displayOptions = item.display_options as { divider_above?: boolean; route?: string } | null;
                  const hasCustomRoute = !!displayOptions?.route;
                  const isHeading = !item.entity_type && !item.is_submenu && !hasChildren(item) && !hasCustomRoute;
                  const isAccordionParent = !item.is_submenu && hasChildren(item);
                  const isAccordionExpanded = expandedAccordionIds.includes(item.id);
                  const showDivider = displayOptions?.divider_above === true;

                  // Non-clickable heading - render as plain text (only if no custom route)
                  if (isHeading) {
                    return (
                      <div key={item.id}>
                        {showDivider && <div className="border-t border-muted-foreground/30 my-3" />}
                        <div className="pt-1 pb-0.5">
                          <h3 className="text-lg font-bold text-black select-none">
                            {item.label}
                          </h3>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={item.id}>
                      {showDivider && <div className="border-t border-muted-foreground/30 my-3" />}
                      <div 
                        className="flex items-center gap-1.5 py-0.5 px-1.5 rounded-lg border transition-colors select-none bg-card border-muted-foreground/30"
                      >
                        <div 
                          onClick={() => {
                            // Skip click for items with no entity_id, unless they have a custom route (like Winter Olympics Selector)
                            const hasCustomRoute = item.display_options && (item.display_options as any).route;
                            if (!item.entity_id && !hasCustomRoute) return;
                            handleItemClick(item);
                          }}
                          className={`flex items-center gap-1.5 flex-1 min-w-0 ${
                            (!item.entity_id && !(item.display_options && (item.display_options as any).route)) ? '' : 'cursor-pointer'
                          }`}
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
                          <span className="text-sm font-medium flex-1 min-w-0">
                            {item.label}
                          </span>
                          {isSubmenu && (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        
                        {/* Heart toggle for favoriting sports and leagues */}
                        {(item.entity_type?.toLowerCase() === 'sport' || item.entity_type?.toLowerCase() === 'league') && item.entity_id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.entity_type?.toLowerCase() === 'sport') {
                                handleSportToggle(item.entity_id!, item.label);
                              } else if (item.entity_type?.toLowerCase() === 'league') {
                                handleLeagueToggle(item.entity_id!, item.label);
                              }
                            }}
                            className="shrink-0 p-1 rounded-md hover:bg-muted/50 transition-colors"
                            title={isSelected ? "Remove from favorites" : "Add to favorites"}
                          >
                            <Heart 
                              className={`h-5 w-5 ${isSelected ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
                            />
                          </button>
                        )}
                        
                        {/* Spacer to align hearts when there's no button */}
                        {!isAccordionParent && !(isLeague && item.entity_id && leagueKinds[item.entity_id] === 'league') && !isSchools && (
                          <div className="w-20 shrink-0" />
                        )}
                        
                        {/* Menu button for accordion parents */}
                        {isAccordionParent && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAccordion(item.id);
                            }}
                            className={`shrink-0 transition-colors w-20 justify-center h-7 ${
                              isAccordionExpanded 
                                ? 'bg-black text-white border-black hover:bg-black hover:text-white' 
                                : 'text-black'
                            }`}
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
                        
                        {/* Schools button for schools entity type */}
                        {isSchools && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              loadAllSchools();
                            }}
                            className="shrink-0 transition-colors w-20 justify-center text-black h-7"
                          >
                            Schools
                            {selectedSchools.length > 0 ? ` (${selectedSchools.length})` : ''}
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
                                  className={`flex items-center gap-1.5 py-0.5 px-1.5 rounded-lg border transition-colors select-none bg-card border-muted-foreground/30 ${
                                    childIsHeadingWithMenu ? '' : 'cursor-pointer'
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
                                    <span className={`text-sm font-medium flex-1 min-w-0 ${childIsHeadingWithMenu ? 'font-bold' : ''}`}>
                                      {child.label}
                                    </span>
                                  </div>
                                  
                                  {/* Heart toggle for favoriting child sports and leagues */}
                                  {(child.entity_type === 'sport' || child.entity_type === 'league') && child.entity_id && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (child.entity_type === 'sport') {
                                          handleSportToggle(child.entity_id!, child.label);
                                        } else if (child.entity_type === 'league') {
                                          handleLeagueToggle(child.entity_id!, child.label);
                                        }
                                      }}
                                      className="shrink-0 p-1 rounded-md hover:bg-muted/50 transition-colors"
                                      title={childIsSelected ? "Remove from favorites" : "Add to favorites"}
                                    >
                                      <Heart 
                                        className={`h-5 w-5 ${childIsSelected ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
                                      />
                                    </button>
                                  )}
                                  
                                  {/* Menu button for nested accordion parents */}
                                  {childHasChildren && (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleAccordion(child.id);
                                      }}
                                      className={`shrink-0 transition-colors w-20 justify-center h-7 ${
                                        childIsAccordionExpanded 
                                          ? 'bg-black text-white border-black hover:bg-black hover:text-white' 
                                          : 'text-black'
                                      }`}
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
                                          className="flex items-center gap-1.5 py-0.5 px-1.5 rounded-lg border transition-colors select-none bg-card border-muted-foreground/30"
                                        >
                                          <div
                                            onClick={() => handleItemClick(grandchild)}
                                            className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer"
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
                                            <span className="text-sm font-medium flex-1 min-w-0">
                                              {grandchild.label}
                                            </span>
                                          </div>
                                          
                                          {/* Heart toggle for favoriting grandchild sports and leagues */}
                                          {(grandchild.entity_type === 'sport' || grandchild.entity_type === 'league') && grandchild.entity_id && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (grandchild.entity_type === 'sport') {
                                                  handleSportToggle(grandchild.entity_id!, grandchild.label);
                                                } else if (grandchild.entity_type === 'league') {
                                                  handleLeagueToggle(grandchild.entity_id!, grandchild.label);
                                                }
                                              }}
                                              className="shrink-0 p-1 rounded-md hover:bg-muted/50 transition-colors"
                                              title={grandchildIsSelected ? "Remove from favorites" : "Add to favorites"}
                                            >
                                              <Heart 
                                                className={`h-5 w-5 ${grandchildIsSelected ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
                                              />
                                            </button>
                                          )}
                                          
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
