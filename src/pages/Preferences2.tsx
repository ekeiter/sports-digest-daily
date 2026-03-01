import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Search, X, ChevronRight, ChevronDown, ArrowLeft, Heart, HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useInvalidateUserPreferences } from "@/hooks/useUserPreferences";
import { useInvalidateArticleFeed } from "@/hooks/useArticleFeed";
import { MobileSidebar } from "@/components/MobileSidebar";
import { searchPeople, PersonSearchResult } from "@/lib/searchPeople";
import { searchSchools, SchoolSearchResult } from "@/lib/searchSchools";
import TrendingPlayers from "@/components/TrendingPlayers";

type MenuItem = Database['public']['Tables']['preference_menu_items']['Row'];
type Team = Database['public']['Tables']['teams']['Row'];
type School = Database['public']['Tables']['schools']['Row'];

export default function Preferences2() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Menu structure
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);
  const [menuStack, setMenuStack] = useState<{ id: number | null; label: string }[]>([]);

  // Teams (for expanded leagues)
  const [teams, setTeams] = useState<Team[]>([]);
  const [expandedLeagueId, setExpandedLeagueId] = useState<number | null>(null);
  const [expandedLeagueTeamIds, setExpandedLeagueTeamIds] = useState<number[]>([]);
  const [expandedLeagueItems, setExpandedLeagueItems] = useState<Array<{
    id: number; display_name: string; nickname?: string; logo_url?: string | null;
  }>>([]);
  const [expandedLeagueType, setExpandedLeagueType] = useState<'team' | 'school' | 'country'>('team');
  const [loadingTeams, setLoadingTeams] = useState(false);

  // Accordion expansion for inline parent items
  const [expandedAccordionIds, setExpandedAccordionIds] = useState<number[]>([]);

  // User selections
  const [selectedSports, setSelectedSports] = useState<number[]>([]);
  const [selectedLeagues, setSelectedLeagues] = useState<number[]>([]);
  const [selectedSchools, setSelectedSchools] = useState<number[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<number[]>([]);
  const [selectedCountriesByLeague, setSelectedCountriesByLeague] = useState<Record<number, number[]>>({});

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
  const searchInputRef = useRef<HTMLInputElement>(null);

  // People search
  const [peopleSearchResults, setPeopleSearchResults] = useState<PersonSearchResult[]>([]);
  const [searchingPeople, setSearchingPeople] = useState(false);
  const [followedPersonIds, setFollowedPersonIds] = useState<Set<number>>(new Set());

  // School search (with league context)
  const [schoolSearchResults, setSchoolSearchResults] = useState<SchoolSearchResult[]>([]);
  const [searchingSchools, setSearchingSchools] = useState(false);
  const invalidatePreferences = useInvalidateUserPreferences();
  const invalidateFeed = useInvalidateArticleFeed();

  // ─── All the same business logic from Preferences.tsx ───
  // (checkUser, loadPreferences, loadAllTeamsAndSchools, loadTeamsForLeague, loadAllSchools,
  //  handleSchoolToggle, handleCountryToggle, handleNavigateToFocus, handleItemClick, handleBack,
  //  handleSportToggle, handleLeagueToggle, handleTeamToggle, getCurrentMenuItems,
  //  getSelectedTeamCountForLeague, getFilteredTeams, getFilteredSchools, getFilteredSportsAndLeagues,
  //  handlePersonFollow, getExpandedLeagueTeams, isItemSelected, hasChildren, getChildItems, toggleAccordion)

  useEffect(() => { checkUser(); }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showSearchDropdown && teamSearchTerm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showSearchDropdown, teamSearchTerm]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }
    setUserId(user.id);
    try { await supabase.rpc('ensure_my_subscriber'); } catch (error) { console.error("Error ensuring subscriber:", error); }
    await loadPreferences();
  };

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: menuData, error: menuError } = await supabase.from("preference_menu_items").select("*").eq("is_visible", true).order("app_order", { ascending: true });
      if (menuError) throw menuError;
      setMenuItems(menuData || []);
      const { data: interests, error: interestsError } = await supabase.from("subscriber_interests").select("sport_id, league_id, team_id, school_id, country_id, person_id, is_olympics").eq("subscriber_id", user.id);
      if (interestsError) throw interestsError;
      const nonOlympicsInterests = (interests || []).filter(i => !i.is_olympics);
      const sportIds = nonOlympicsInterests.filter(i => i.sport_id !== null).map(i => i.sport_id as number);
      const leagueIds = nonOlympicsInterests.filter(i => i.league_id !== null && i.team_id === null && i.school_id === null && i.country_id === null).map(i => i.league_id as number);
      const teamIds = nonOlympicsInterests.filter(i => i.team_id !== null).map(i => i.team_id as number);
      const schoolIds = nonOlympicsInterests.filter(i => i.school_id !== null).map(i => i.school_id as number);
      const personIds = nonOlympicsInterests.filter(i => i.person_id !== null).map(i => i.person_id as number);
      setFollowedPersonIds(new Set(personIds));
      const schoolsByLeagueMap: Record<number, number[]> = {};
      nonOlympicsInterests.filter(i => i.school_id !== null && i.league_id !== null).forEach(i => {
        const leagueId = i.league_id as number;
        const schoolId = i.school_id as number;
        if (!schoolsByLeagueMap[leagueId]) schoolsByLeagueMap[leagueId] = [];
        schoolsByLeagueMap[leagueId].push(schoolId);
      });
      setSelectedSchoolsByLeague(schoolsByLeagueMap);
      const countriesByLeagueMap: Record<number, number[]> = {};
      const countryIds = nonOlympicsInterests.filter(i => i.country_id !== null).map(i => i.country_id as number);
      nonOlympicsInterests.filter(i => i.country_id !== null && i.league_id !== null).forEach(i => {
        const leagueId = i.league_id as number;
        const countryId = i.country_id as number;
        if (!countriesByLeagueMap[leagueId]) countriesByLeagueMap[leagueId] = [];
        countriesByLeagueMap[leagueId].push(countryId);
      });
      setSelectedCountriesByLeague(countriesByLeagueMap);
      const allSportsSchoolIds = nonOlympicsInterests.filter(i => i.school_id !== null && i.league_id === null).map(i => i.school_id as number);
      setAllSportsSchools(new Set(allSportsSchoolIds));
      setSelectedSports(sportIds);
      setSelectedLeagues(leagueIds);
      setSelectedSchools(schoolIds);
      setSelectedCountries(countryIds);
      setSelectedTeams(teamIds);
      const allMappings: Array<{ league_id: number; team_id: number }> = [];
      const pageSize = 1000;
      for (let from = 0;; from += pageSize) {
        const { data: page, error: pageError } = await supabase.from("league_teams").select("league_id, team_id").range(from, from + pageSize - 1);
        if (pageError) throw pageError;
        if (!page || page.length === 0) break;
        allMappings.push(...page);
        if (page.length < pageSize) break;
      }
      if (allMappings.length > 0) {
        const mapping: Record<number, number[]> = {};
        allMappings.forEach(m => { if (!mapping[m.league_id]) mapping[m.league_id] = []; mapping[m.league_id].push(m.team_id); });
        setLeagueTeamMap(mapping);
      }
      const { data: leaguesData } = await supabase.from("leagues").select("id, kind");
      if (leaguesData) {
        const kindsMap: Record<number, string> = {};
        leaguesData.forEach(l => { kindsMap[l.id] = l.kind; });
        setLeagueKinds(kindsMap);
      }
      if (teamIds.length > 0) {
        const { data: selectedTeamsData } = await supabase.from("teams").select("*").in("id", teamIds);
        if (selectedTeamsData) setTeams(selectedTeamsData);
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
      toast.error("Failed to load preferences");
    } finally { setLoading(false); }
  };

  const loadAllTeamsAndSchools = async () => {
    if (!allTeamsLoaded) {
      setLoadingAllTeams(true);
      try {
        const pageSize = 1000; let allTeamsData: Team[] = []; let page = 0; let hasMore = true;
        while (hasMore) {
          const from = page * pageSize; const to = from + pageSize - 1;
          const { data: teamsData, error: teamsError } = await supabase.from("teams").select("*").order("display_name", { ascending: true }).range(from, to);
          if (teamsError) throw teamsError;
          if (teamsData && teamsData.length > 0) { allTeamsData = [...allTeamsData, ...teamsData]; hasMore = teamsData.length === pageSize; page++; } else { hasMore = false; }
        }
        setTeams(allTeamsData); setAllTeamsLoaded(true);
      } catch (error) { console.error("Error loading all teams:", error); toast.error("Failed to load teams"); } finally { setLoadingAllTeams(false); }
    }
    if (!allSchoolsLoaded) {
      setLoadingAllSchoolsSearch(true);
      try {
        const { data: schoolsData, error } = await supabase.from("schools").select("*").order("name", { ascending: true });
        if (error) throw error;
        setSchools(schoolsData || []); setAllSchoolsLoaded(true);
      } catch (error) { console.error("Error loading all schools:", error); toast.error("Failed to load schools"); } finally { setLoadingAllSchoolsSearch(false); }
    }
  };

  const loadTeamsForLeague = async (leagueId: number) => {
    setLoadingTeams(true);
    try {
      const { data: leagueData } = await supabase.from("leagues").select("team_type").eq("id", leagueId).single();
      const teamType = leagueData?.team_type;
      let itemsData: Array<{ id: number; display_name: string; nickname?: string; logo_url?: string | null }> = [];
      let resolvedType: 'team' | 'school' | 'country' = 'team';
      if (teamType === 'country') {
        resolvedType = 'country';
        const { data: mappings, error } = await supabase.from("league_countries").select("countries(*)").eq("league_id", leagueId);
        if (error) throw error;
        itemsData = (mappings?.map(m => m.countries).filter(Boolean) || []).map(c => ({ id: c.id, display_name: c.name, nickname: c.code, logo_url: c.logo_url }));
      } else if (teamType === 'school') {
        resolvedType = 'school';
        const { data: mappings, error } = await supabase.from("league_schools").select("schools(*)").eq("league_id", leagueId);
        if (error) throw error;
        itemsData = (mappings?.map(m => m.schools).filter(Boolean) || []).map(s => ({ id: s.id, display_name: s.name, nickname: s.short_name, logo_url: s.logo_url }));
      } else {
        resolvedType = 'team';
        const { data: mappings, error } = await supabase.from("league_teams").select("teams(*)").eq("league_id", leagueId);
        if (error) throw error;
        itemsData = (mappings?.map(m => m.teams).filter(Boolean) || []).map(t => ({ id: t.id, display_name: t.display_name, nickname: t.nickname, logo_url: t.logo_url }));
      }
      itemsData.sort((a, b) => a.display_name.localeCompare(b.display_name));
      setExpandedLeagueItems(itemsData); setExpandedLeagueType(resolvedType);
      setExpandedLeagueTeamIds(itemsData.map(t => t.id)); setExpandedLeagueId(leagueId);
    } catch (error) { console.error("Error loading teams:", error); toast.error("Failed to load teams"); } finally { setLoadingTeams(false); }
  };

  const loadAllSchools = async () => {
    setLoadingSchools(true);
    try {
      const { data: schoolsData, error } = await supabase.from("schools").select("*").order("name", { ascending: true });
      if (error) throw error;
      setSchools(schoolsData || []); setShowSchoolsView(true);
    } catch (error) { console.error("Error loading schools:", error); toast.error("Failed to load schools"); } finally { setLoadingSchools(false); }
  };

  const handleSchoolToggle = async (schoolId: number, leagueId?: number | null) => {
    const expandedItem = expandedLeagueItems.find(i => i.id === schoolId);
    const schoolItem = schools.find(s => s.id === schoolId);
    const label = expandedItem?.display_name || schoolItem?.name || 'school';
    const isCurrentlySelected = selectedSchools.includes(schoolId);
    try {
      if (isCurrentlySelected) {
        const { error } = await supabase.from("subscriber_interests").delete().eq("subscriber_id", userId).eq("school_id", schoolId);
        if (error) throw error;
        setSelectedSchools(prev => prev.filter(id => id !== schoolId));
        if (leagueId) { setSelectedSchoolsByLeague(prev => ({ ...prev, [leagueId]: (prev[leagueId] || []).filter(id => id !== schoolId) })); }
        toast(`Unfollowed ${label}`);
      } else {
        const insertData: { subscriber_id: string | null; school_id: number; league_id?: number } = { subscriber_id: userId, school_id: schoolId };
        if (leagueId) insertData.league_id = leagueId;
        const { error } = await supabase.from("subscriber_interests").insert(insertData);
        if (error) throw error;
        setSelectedSchools(prev => [...prev, schoolId]);
        if (leagueId) { setSelectedSchoolsByLeague(prev => ({ ...prev, [leagueId]: [...(prev[leagueId] || []), schoolId] })); }
        toast.success(`Followed ${label}`);
      }
      if (userId) { invalidatePreferences(userId); invalidateFeed(userId); }
    } catch (error) { console.error("Error toggling school:", error); toast.error("Could not update your preferences. Please try again."); }
  };

  const handleCountryToggle = async (countryId: number, leagueId?: number | null) => {
    const expandedItem = expandedLeagueItems.find(i => i.id === countryId);
    const label = expandedItem?.display_name || 'country';
    const isCurrentlySelected = selectedCountries.includes(countryId);
    try {
      if (isCurrentlySelected) {
        let query = supabase.from("subscriber_interests").delete().eq("subscriber_id", userId).eq("country_id", countryId);
        if (leagueId) query = query.eq("league_id", leagueId);
        const { error } = await query;
        if (error) throw error;
        setSelectedCountries(prev => prev.filter(id => id !== countryId));
        if (leagueId) { setSelectedCountriesByLeague(prev => ({ ...prev, [leagueId]: (prev[leagueId] || []).filter(id => id !== countryId) })); }
        toast(`Unfollowed ${label}`);
      } else {
        const insertData: { subscriber_id: string | null; country_id: number; league_id?: number } = { subscriber_id: userId, country_id: countryId };
        if (leagueId) insertData.league_id = leagueId;
        const { error } = await supabase.from("subscriber_interests").insert(insertData);
        if (error) throw error;
        setSelectedCountries(prev => [...prev, countryId]);
        if (leagueId) { setSelectedCountriesByLeague(prev => ({ ...prev, [leagueId]: [...(prev[leagueId] || []), countryId] })); }
        toast.success(`Followed ${label}`);
      }
      if (userId) { invalidatePreferences(userId); invalidateFeed(userId); }
    } catch (error) { console.error("Error toggling country:", error); toast.error("Could not update your preferences. Please try again."); }
  };

  const handleNavigateToFocus = (entityType: 'sport' | 'league' | 'team' | 'school' | 'person' | 'country', entityId: number, leagueId?: number | null) => {
    let url = `/feed?type=${entityType}&id=${entityId}`;
    if ((entityType === 'school' || entityType === 'country') && leagueId) url += `&leagueId=${leagueId}`;
    navigate(url);
  };

  const handleItemClick = async (item: MenuItem) => {
    const displayOptions = item.display_options as { route?: string } | null;
    if (displayOptions?.route) { navigate(displayOptions.route); return; }
    if (item.entity_type && item.entity_id) {
      if (item.entity_type === 'sport') await handleNavigateToFocus('sport', item.entity_id);
      else if (item.entity_type === 'league') await handleNavigateToFocus('league', item.entity_id);
      return;
    }
    if (item.entity_type === 'schools') { loadAllSchools(); return; }
    if (item.is_submenu) {
      setMenuStack(prev => [...prev, { id: currentParentId, label: item.label }]);
      setCurrentParentId(item.id); setExpandedLeagueId(null); setShowSchoolsView(false);
      return;
    }
  };

  const handleBack = () => {
    if (expandedLeagueId !== null) { setExpandedLeagueId(null); return; }
    if (showSchoolsView) { setShowSchoolsView(false); return; }
    if (menuStack.length > 0) {
      const prev = menuStack[menuStack.length - 1];
      setMenuStack(s => s.slice(0, -1)); setCurrentParentId(prev.id);
    }
  };

  const handleSportToggle = async (sportId: number, label: string) => {
    const isCurrentlySelected = selectedSports.includes(sportId);
    try {
      if (isCurrentlySelected) {
        const { error } = await supabase.from("subscriber_interests").delete().eq("subscriber_id", userId).eq("sport_id", sportId);
        if (error) throw error;
        setSelectedSports(prev => prev.filter(id => id !== sportId));
        toast(`Unfollowed ${label}`);
      } else {
        const { error } = await supabase.from("subscriber_interests").insert({ subscriber_id: userId, sport_id: sportId });
        if (error) throw error;
        setSelectedSports(prev => [...prev, sportId]);
        toast.success(`Followed ${label}`);
      }
      if (userId) { invalidatePreferences(userId); invalidateFeed(userId); }
    } catch (error) { console.error("Error toggling sport:", error); toast.error("Could not update your preferences. Please try again."); }
  };

  const handleLeagueToggle = async (leagueId: number, label: string) => {
    const isCurrentlySelected = selectedLeagues.includes(leagueId);
    try {
      if (isCurrentlySelected) {
        const { error } = await supabase.from("subscriber_interests").delete().eq("subscriber_id", userId).eq("league_id", leagueId);
        if (error) throw error;
        setSelectedLeagues(prev => prev.filter(id => id !== leagueId));
        toast(`Unfollowed ${label}`);
      } else {
        const { error } = await supabase.from("subscriber_interests").insert({ subscriber_id: userId, league_id: leagueId });
        if (error) throw error;
        setSelectedLeagues(prev => [...prev, leagueId]);
        toast.success(`Followed ${label}`);
      }
      if (userId) { invalidatePreferences(userId); invalidateFeed(userId); }
    } catch (error) { console.error("Error toggling league:", error); toast.error("Could not update your preferences. Please try again."); }
  };

  const handleTeamToggle = async (teamId: number) => {
    const team = teams.find(t => t.id === teamId);
    const label = team?.display_name || 'team';
    const isCurrentlySelected = selectedTeams.includes(teamId);
    try {
      if (isCurrentlySelected) {
        const { error } = await supabase.from("subscriber_interests").delete().eq("subscriber_id", userId).eq("team_id", teamId);
        if (error) throw error;
        setSelectedTeams(prev => prev.filter(id => id !== teamId));
        toast(`Unfollowed ${label}`);
      } else {
        const { error } = await supabase.from("subscriber_interests").insert({ subscriber_id: userId, team_id: teamId });
        if (error) throw error;
        setSelectedTeams(prev => [...prev, teamId]);
        toast.success(`Followed ${label}`);
      }
      if (userId) { invalidatePreferences(userId); invalidateFeed(userId); }
    } catch (error) { console.error("Error toggling team:", error); toast.error("Could not update your preferences. Please try again."); }
  };

  const getCurrentMenuItems = () => menuItems.filter(item => item.parent_id === currentParentId);

  const getSelectedTeamCountForLeague = (leagueId: number) => {
    const schoolsForLeague = selectedSchoolsByLeague[leagueId] || [];
    if (schoolsForLeague.length > 0) return schoolsForLeague.length;
    const teamIdsForLeague = leagueTeamMap[leagueId] || [];
    return teamIdsForLeague.filter(teamId => selectedTeams.includes(teamId)).length;
  };

  const getFilteredTeams = () => {
    if (!teamSearchTerm) return [];
    const searchLower = teamSearchTerm.toLowerCase();
    return teams.filter(team => team.display_name.toLowerCase().includes(searchLower) || team.nickname?.toLowerCase().includes(searchLower) || team.city_state_name?.toLowerCase().includes(searchLower)).sort((a, b) => a.display_name.localeCompare(b.display_name));
  };

  const getFilteredSchools = () => {
    if (!teamSearchTerm) return [];
    const searchLower = teamSearchTerm.toLowerCase();
    return schools.filter(school => school.name.toLowerCase().includes(searchLower) || school.short_name?.toLowerCase().includes(searchLower) || school.aliases?.some(alias => alias.toLowerCase().includes(searchLower))).sort((a, b) => a.name.localeCompare(b.name));
  };

  useEffect(() => {
    if (!teamSearchTerm || teamSearchTerm.length < 2) { setSchoolSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearchingSchools(true);
      try { const results = await searchSchools(teamSearchTerm); setSchoolSearchResults(results.slice(0, 30)); }
      catch (error) { console.error("Error searching schools:", error); }
      finally { setSearchingSchools(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [teamSearchTerm]);

  useEffect(() => {
    if (!teamSearchTerm || teamSearchTerm.length < 2) { setPeopleSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearchingPeople(true);
      try { const results = await searchPeople(teamSearchTerm); setPeopleSearchResults(results.slice(0, 10)); }
      catch (error) { console.error("Error searching people:", error); }
      finally { setSearchingPeople(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [teamSearchTerm, followedPersonIds]);

  const getFilteredSportsAndLeagues = useCallback(() => {
    if (!teamSearchTerm) return { sports: [] as MenuItem[], leagues: [] as MenuItem[] };
    const searchLower = teamSearchTerm.toLowerCase();
    const sports = menuItems.filter(item => item.entity_type === 'sport' && item.label.toLowerCase().includes(searchLower));
    const leagues = menuItems.filter(item => item.entity_type === 'league' && item.label.toLowerCase().includes(searchLower));
    return { sports, leagues };
  }, [teamSearchTerm, menuItems]);

  const handlePersonFollow = async (person: PersonSearchResult) => {
    if (!userId) return;
    try {
      const { error } = await supabase.from("subscriber_interests").insert({ subscriber_id: userId, person_id: person.id, notification_enabled: true, priority: 1 });
      if (error) throw error;
      toast.success(`Now following ${person.name}`);
      setFollowedPersonIds(prev => new Set([...prev, person.id]));
      setPeopleSearchResults(prev => prev.filter(p => p.id !== person.id));
      setShowSearchDropdown(false); setTeamSearchTerm("");
      invalidatePreferences(userId); invalidateFeed(userId);
    } catch (error) { console.error("Error following person:", error); toast.error("Failed to follow. Please try again."); }
  };

  const getExpandedLeagueTeams = () => expandedLeagueId ? expandedLeagueItems : [];
  const isItemSelected = (item: MenuItem) => {
    if (item.entity_type === 'sport' && item.entity_id) return selectedSports.includes(item.entity_id);
    if (item.entity_type === 'league' && item.entity_id) return selectedLeagues.includes(item.entity_id);
    return false;
  };
  const hasChildren = (item: MenuItem) => menuItems.some(m => m.parent_id === item.id);
  const getChildItems = (parentId: number) => menuItems.filter(item => item.parent_id === parentId).sort((a, b) => (a.app_order ?? 0) - (b.app_order ?? 0));
  const toggleAccordion = (itemId: number) => { setExpandedAccordionIds(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]); };

  // ─── RENDER ───

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const currentItems = getCurrentMenuItems();
  const currentLabel = menuStack.length > 0 ? menuStack[menuStack.length - 1].label : null;
  const expandedLeague = expandedLeagueId ? menuItems.find(m => m.entity_type === 'league' && m.entity_id === expandedLeagueId) : null;

  // ─── Card component for a single menu item ───
  const renderItemCard = (item: MenuItem) => {
    const isSelected = isItemSelected(item);
    const isLeague = item.entity_type === 'league';
    const isSchools = item.entity_type === 'schools';
    const isSubmenu = item.is_submenu && hasChildren(item);
    const displayOptions = item.display_options as { divider_above?: boolean; route?: string } | null;
    const hasCustomRoute = !!displayOptions?.route;
    const isHeading = !item.entity_type && !item.is_submenu && !hasChildren(item) && !hasCustomRoute;
    const isAccordionParent = !item.is_submenu && hasChildren(item);
    const isAccordionExpanded = expandedAccordionIds.includes(item.id);

    // Headings span the full width
    // Headings are now rendered as section titles, skip them here
    if (isHeading) {
      return null;
    }

    return (
      <div key={item.id} className={isAccordionParent && isAccordionExpanded ? "col-span-3" : ""}>
        <div
          className="flex flex-col items-center gap-1 p-3 pt-4 rounded-xl bg-background shadow-[0_6px_20px_rgba(0,0,0,0.22),0_2px_6px_rgba(0,0,0,0.14)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.28),0_4px_10px_rgba(0,0,0,0.16)] transition-shadow cursor-pointer select-none relative h-[130px]"
          onClick={() => {
            if (isAccordionParent) { toggleAccordion(item.id); return; }
            const hasRoute = item.display_options && (item.display_options as any).route;
            if (!item.entity_id && !hasRoute) return;
            handleItemClick(item);
          }}
        >
          {/* Heart in top-right corner */}
          {(item.entity_type?.toLowerCase() === 'sport' || item.entity_type?.toLowerCase() === 'league') && item.entity_id && (
            <button
              onClick={e => {
                e.stopPropagation();
                if (item.entity_type?.toLowerCase() === 'sport') handleSportToggle(item.entity_id!, item.label);
                else if (item.entity_type?.toLowerCase() === 'league') handleLeagueToggle(item.entity_id!, item.label);
              }}
              className="absolute top-2 right-2 p-0.5 rounded-full hover:bg-muted/50 transition-colors"
              title={isSelected ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart className={`h-4 w-4 ${isSelected ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
            </button>
          )}

          {/* Logo */}
          {item.logo_url ? (
            <div className="flex items-center justify-center w-10 h-10 dark:bg-white dark:rounded-md dark:p-0.5">
              <img src={item.logo_url} alt={item.label} className="h-9 w-9 object-contain" onError={e => e.currentTarget.style.display = 'none'} />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
              {item.label.slice(0, 2)}
            </div>
          )}

          {/* Label */}
          <span className="text-xs font-medium text-center leading-tight line-clamp-2 h-[2lh]">{item.label}</span>

          {/* Button slot - fixed height to keep layout consistent */}
          <div className="h-5 flex items-center justify-center mt-auto pt-1">

          {/* Sub-indicators */}
          {isSubmenu && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          {isLeague && item.entity_id && leagueKinds[item.entity_id] === 'league' && (
            <button
              onClick={e => { e.stopPropagation(); loadTeamsForLeague(item.entity_id!); }}
              className="text-[10px] w-[4.5rem] text-center px-1 py-0.5 rounded-md border border-border bg-[#F4F4F4] text-foreground shadow-sm hover:bg-muted hover:shadow-md transition-all font-medium"
            >
              Teams{(() => { const c = getSelectedTeamCountForLeague(item.entity_id!); return c > 0 ? ` (${c})` : ''; })()}
            </button>
          )}
          {isAccordionParent && (
            <span className="text-[10px] w-[4.5rem] text-center px-1 py-0.5 rounded-md border border-border bg-[#F4F4F4] text-foreground shadow-sm font-medium">{isAccordionExpanded ? 'Close' : 'Menu'}</span>
          )}
          {isSchools && (
            <button
              onClick={e => { e.stopPropagation(); loadAllSchools(); }}
              className="text-[10px] w-[4.5rem] text-center px-1 py-0.5 rounded-md border border-border bg-[#F4F4F4] text-foreground shadow-sm hover:bg-muted hover:shadow-md transition-all font-medium"
            >
              Schools{selectedSchools.length > 0 ? ` (${selectedSchools.length})` : ''}
            </button>
          )}
          </div>
        </div>

        {/* Accordion children in a sub-grid */}
        {isAccordionParent && isAccordionExpanded && (
          <div className="grid grid-cols-3 gap-2 mt-2 ml-2 mb-2">
            {getChildItems(item.id).map(child => renderItemCard(child))}
          </div>
        )}
      </div>
    );
  };

  // ─── Card for team/school/country items in expanded league view ───
  const renderEntityCard = (item: { id: number; display_name: string; nickname?: string; logo_url?: string | null }, entityType: 'team' | 'school' | 'country') => {
    const isSelected = entityType === 'school'
      ? allSportsSchools.has(item.id) || selectedSchools.includes(item.id)
      : entityType === 'country'
        ? (expandedLeagueId ? (selectedCountriesByLeague[expandedLeagueId] || []).includes(item.id) : selectedCountries.includes(item.id))
        : selectedTeams.includes(item.id);

    return (
      <div
        key={item.id}
        className="flex flex-col items-center gap-1 px-2 pb-2 pt-2 rounded-xl bg-background shadow-[0_6px_20px_rgba(0,0,0,0.22),0_2px_6px_rgba(0,0,0,0.14)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.28),0_4px_10px_rgba(0,0,0,0.16)] transition-shadow cursor-pointer select-none relative h-[116px]"
        onClick={() => handleNavigateToFocus(
          entityType,
          item.id,
          (entityType === 'school' || entityType === 'country') ? expandedLeagueId : undefined
        )}
      >
        {/* Heart in top-right */}
        <div className="w-full flex justify-end">
          <button
            onClick={e => {
              e.stopPropagation();
              if (entityType === 'school') handleSchoolToggle(item.id, expandedLeagueId);
              else if (entityType === 'country') handleCountryToggle(item.id, expandedLeagueId);
              else handleTeamToggle(item.id);
            }}
            className="p-0.5 rounded-full hover:bg-muted/50 transition-colors relative"
            title={isSelected ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={`h-4 w-4 ${isSelected ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
            {entityType === 'school' && allSportsSchools.has(item.id) && (
              <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-white">A</span>
            )}
          </button>
        </div>

        {/* Logo + name centered */}
        {item.logo_url ? (
          <div className="flex items-center justify-center w-11 h-11 dark:bg-white dark:rounded-md dark:p-0.5">
            <img src={item.logo_url} alt={item.display_name} className="h-10 w-10 object-contain" onError={e => e.currentTarget.style.display = 'none'} />
          </div>
        ) : (
          <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
            {item.display_name.slice(0, 2)}
          </div>
        )}
        <span className="text-xs font-medium text-center leading-tight line-clamp-2">{item.display_name}</span>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-page-bg overflow-hidden">
      {/* ─── Header (same as Preferences) ─── */}
      <header className="bg-page-bg flex-shrink-0 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center md:hidden">
            <div className="w-10 flex justify-start"><MobileSidebar /></div>
            <div className="flex-1 flex items-center justify-center gap-2">
              <span className="text-lg font-bold text-foreground">Feed Topic Manager</span>
              <button onClick={() => setShowHelpDialog(true)} className="p-1 rounded-full hover:bg-black/10 transition-colors" aria-label="Help"><HelpCircle className="h-6 w-6 text-[#1e3a5f]" /></button>
            </div>
            <div className="w-10 flex justify-end">
              {(menuStack.length > 0 || expandedLeagueId !== null || showSchoolsView) && (
                <button onClick={handleBack} className="p-1 bg-black rounded transition-transform hover:scale-110" aria-label="Go back"><ArrowLeft className="h-5 w-5 text-white" /></button>
              )}
            </div>
          </div>
          <div className="hidden md:flex items-center">
            <div className="w-10" />
            <div className="flex-1 flex items-center justify-center gap-3">
              <span className="text-xl font-bold text-foreground">Feed Topic Manager</span>
              <button onClick={() => setShowHelpDialog(true)} className="p-1 rounded-full hover:bg-black/10 transition-colors" aria-label="Help"><HelpCircle className="h-6 w-6 text-[#1e3a5f]" /></button>
            </div>
            <div className="w-10 flex justify-end">
              {(menuStack.length > 0 || expandedLeagueId !== null || showSchoolsView) && (
                <button onClick={handleBack} className="p-1 bg-black rounded transition-transform hover:scale-110" aria-label="Go back"><ArrowLeft className="h-5 w-5 text-white" /></button>
              )}
            </div>
          </div>

          <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>How to Use the Feed Topic Manager</DialogTitle>
                <DialogDescription className="sr-only">Instructions for using the Feed Topic Manager</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p><span className="font-bold text-foreground">Browsing Topics</span> - Clicking on any topic will take you to a focused news feed for that topic.</p>
                <p><span className="font-bold text-foreground">Searching</span> - Use the search bar to find teams, colleges, players, coaches, etc.</p>
                <p><span className="font-bold text-foreground">Adding Favorites</span> - Tap the heart icon to add to favorites.</p>
                <p><span className="font-bold text-foreground">Combined Feed</span> - Shows articles from all your favorites in one unified stream.</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* ─── Content ─── */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-1.5 py-3 max-w-lg">
          {/* Search bar - same as original */}
          <div className={`mb-4 relative ${showSearchDropdown && teamSearchTerm ? 'z-[6]' : ''}`} ref={searchRef}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search teams, players, colleges, sports, leagues..."
                  value={teamSearchTerm}
                  onChange={e => {
                    const newValue = e.target.value;
                    const wasEmpty = !teamSearchTerm;
                    setTeamSearchTerm(newValue);
                    setShowSearchDropdown(true);
                    if (newValue && (!allTeamsLoaded || !allSchoolsLoaded)) loadAllTeamsAndSchools();
                    if (wasEmpty && newValue && window.innerWidth < 1024) {
                      setTimeout(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, 100);
                    }
                  }}
                  onFocus={() => { if (teamSearchTerm) setShowSearchDropdown(true); }}
                  className="pr-8 bg-white text-base md:text-sm placeholder:text-sm"
                />
                {teamSearchTerm && (
                  <button type="button" onClick={() => { setTeamSearchTerm(""); setShowSearchDropdown(false); setPeopleSearchResults([]); setSchoolSearchResults([]); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button disabled={loadingAllTeams || searchingSchools || searchingPeople}>
                {loadingAllTeams || searchingSchools || searchingPeople ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            {/* Search dropdown - keep as list for usability */}
            {showSearchDropdown && teamSearchTerm && (
              <div className="absolute z-10 left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg max-h-96 overflow-y-auto">
                {loadingAllTeams ? (
                  <div className="flex items-center justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
                ) : (
                  <>
                    {getFilteredSportsAndLeagues().sports.length > 0 && (
                      <>
                        <h3 className="font-semibold text-sm text-muted-foreground p-2 border-b bg-muted/50">Sports</h3>
                        {getFilteredSportsAndLeagues().sports.slice(0, 10).map(item => {
                          const isSel = item.entity_id ? selectedSports.includes(item.entity_id) : false;
                          return (
                            <div key={`sport-${item.id}`} className="flex items-center gap-1.5 p-2 hover:bg-accent border-b last:border-b-0 select-none">
                              {item.logo_url && <div className="flex items-center justify-center w-8 h-8 flex-shrink-0 dark:bg-white dark:rounded-md dark:p-0.5"><img src={item.logo_url} alt={item.label} className="h-7 w-7 object-contain" onError={e => e.currentTarget.style.display = 'none'} /></div>}
                              <span onClick={() => { if (item.entity_id) handleNavigateToFocus('sport', item.entity_id); setShowSearchDropdown(false); setTeamSearchTerm(""); }} className="text-xs lg:text-sm font-medium truncate flex-1 min-w-0 cursor-pointer">{item.label}</span>
                              <Heart className={`h-5 w-5 cursor-pointer flex-shrink-0 ${isSel ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'}`} onClick={e => { e.stopPropagation(); if (item.entity_id) handleSportToggle(item.entity_id, item.label); }} />
                            </div>
                          );
                        })}
                      </>
                    )}
                    {getFilteredSportsAndLeagues().leagues.length > 0 && (
                      <>
                        <h3 className="font-semibold text-sm text-muted-foreground p-2 border-b bg-muted/50">Leagues</h3>
                        {getFilteredSportsAndLeagues().leagues.slice(0, 10).map(item => {
                          const isSel = item.entity_id ? selectedLeagues.includes(item.entity_id) : false;
                          return (
                            <div key={`league-${item.id}`} className="flex items-center gap-1.5 p-2 hover:bg-accent border-b last:border-b-0 select-none">
                              {item.logo_url && <div className="flex items-center justify-center w-8 h-8 flex-shrink-0 dark:bg-white dark:rounded-md dark:p-0.5"><img src={item.logo_url} alt={item.label} className="h-7 w-7 object-contain" onError={e => e.currentTarget.style.display = 'none'} /></div>}
                              <span onClick={() => { if (item.entity_id) handleNavigateToFocus('league', item.entity_id); setShowSearchDropdown(false); setTeamSearchTerm(""); }} className="text-xs lg:text-sm font-medium truncate flex-1 min-w-0 cursor-pointer">{item.label}</span>
                              <Heart className={`h-5 w-5 cursor-pointer flex-shrink-0 ${isSel ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'}`} onClick={e => { e.stopPropagation(); if (item.entity_id) handleLeagueToggle(item.entity_id, item.label); }} />
                            </div>
                          );
                        })}
                      </>
                    )}
                    {getFilteredTeams().length > 0 && (
                      <>
                        <h3 className="font-semibold text-sm text-muted-foreground p-2 border-b bg-muted/50">Teams</h3>
                        {getFilteredTeams().slice(0, 15).map(team => {
                          const isSel = selectedTeams.includes(Number(team.id));
                          return (
                            <div key={`team-${team.id}`} className="flex items-center gap-1.5 p-2 hover:bg-accent border-b last:border-b-0 select-none">
                              {team.logo_url && <div className="flex items-center justify-center w-8 h-8 flex-shrink-0 dark:bg-white dark:rounded-md dark:p-0.5"><img src={team.logo_url} alt={team.display_name} className="h-7 w-7 object-contain" onError={e => e.currentTarget.style.display = 'none'} /></div>}
                              <span onClick={() => { handleNavigateToFocus('team', Number(team.id)); setShowSearchDropdown(false); setTeamSearchTerm(""); }} className="text-xs lg:text-sm font-medium truncate flex-1 min-w-0 cursor-pointer">{team.display_name}</span>
                              <Heart className={`h-5 w-5 cursor-pointer flex-shrink-0 ${isSel ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'}`} onClick={e => { e.stopPropagation(); handleTeamToggle(Number(team.id)); }} />
                            </div>
                          );
                        })}
                      </>
                    )}
                    {(schoolSearchResults.length > 0 || searchingSchools) && (
                      <>
                        <h3 className="font-semibold text-sm text-muted-foreground p-2 border-b bg-muted/50">Schools</h3>
                        {searchingSchools ? <div className="flex items-center justify-center py-2"><Loader2 className="h-4 w-4 animate-spin" /></div> : schoolSearchResults.map(result => {
                          const isAllSportsSelected = result.league_id === null && allSportsSchools.has(result.school_id);
                          const isLeagueSpecificSelected = result.league_id !== null && selectedSchoolsByLeague[result.league_id]?.includes(result.school_id);
                          const isSel = isAllSportsSelected || isLeagueSpecificSelected;
                          return (
                            <div key={`school-${result.school_id}-${result.league_id ?? 'all'}`} className="flex items-center gap-1.5 p-2 hover:bg-accent border-b last:border-b-0 select-none">
                              {result.logo_url && <div className="flex items-center justify-center w-8 h-8 flex-shrink-0 dark:bg-white dark:rounded-md dark:p-0.5"><img src={result.logo_url} alt={result.name} className="h-7 w-7 object-contain" onError={e => e.currentTarget.style.display = 'none'} /></div>}
                              <span onClick={() => { handleNavigateToFocus('school', result.school_id, result.league_id); setShowSearchDropdown(false); setTeamSearchTerm(""); }} className="text-xs lg:text-sm font-medium truncate flex-1 min-w-0 cursor-pointer">{result.display_label}</span>
                              <Heart className={`h-5 w-5 cursor-pointer flex-shrink-0 ${isSel ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'}`} onClick={e => { e.stopPropagation(); handleSchoolToggle(result.school_id, result.league_id); }} />
                            </div>
                          );
                        })}
                      </>
                    )}
                    {peopleSearchResults.length > 0 && (
                      <>
                        <h3 className="font-semibold text-sm text-muted-foreground p-2 border-b bg-muted/50">Players & Coaches</h3>
                        {peopleSearchResults.map(person => {
                          const logoUrl = person.teams?.logo_url || person.schools?.logo_url || person.leagues?.logo_url || person.sports?.logo_url;
                          const isFollowed = followedPersonIds.has(person.id);
                          return (
                            <div key={`person-${person.id}`} className="flex items-center gap-1.5 p-2 hover:bg-accent border-b last:border-b-0 select-none">
                              {logoUrl && <div className="flex items-center justify-center w-8 h-8 flex-shrink-0 dark:bg-white dark:rounded-md dark:p-0.5"><img src={logoUrl} alt={person.name} className="h-7 w-7 object-contain" onError={e => e.currentTarget.style.display = 'none'} /></div>}
                              <div onClick={() => { handleNavigateToFocus('person', person.id); setShowSearchDropdown(false); setTeamSearchTerm(""); }} className="flex flex-col min-w-0 flex-1 cursor-pointer">
                                <span className="text-xs lg:text-sm font-medium truncate flex items-center gap-1.5">
                                  {person.name}
                                  {person.position && <span className="text-muted-foreground font-normal">• {person.position}</span>}
                                  {person.countries?.logo_url && <img src={person.countries.logo_url} alt={person.countries.name} className="h-4 w-5 object-contain flex-shrink-0" />}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {[person.teams?.display_name || person.schools?.short_name, person.leagues?.code].filter(Boolean).join(' • ')}
                                </span>
                              </div>
                              <Heart className={`h-5 w-5 cursor-pointer flex-shrink-0 ${isFollowed ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'}`} onClick={e => { e.stopPropagation(); if (!isFollowed) handlePersonFollow(person); }} />
                            </div>
                          );
                        })}
                      </>
                    )}
                    {getFilteredSportsAndLeagues().sports.length === 0 && getFilteredSportsAndLeagues().leagues.length === 0 && getFilteredTeams().length === 0 && schoolSearchResults.length === 0 && peopleSearchResults.length === 0 && !searchingPeople && !searchingSchools && (
                      <p className="text-sm text-muted-foreground text-center py-4">No results found</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* ─── Main content as CARD GRID ─── */}
          {showSchoolsView ? (
            <div className="space-y-3">
              <div className="bg-card rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-3">
                <h2 className="text-lg font-bold text-center mb-3">Schools</h2>
                {loadingSchools ? (
                  <div className="flex items-center justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5">
                    {schools.map(school => renderEntityCard(
                      { id: school.id, display_name: school.name, nickname: school.short_name, logo_url: school.logo_url },
                      'school'
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : expandedLeagueId !== null ? (
            <div className="space-y-3">
              <div className="bg-card rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-2">
                <h2 className="text-lg font-bold text-center mb-2">
                  {expandedLeague?.label} {expandedLeagueType === 'school' ? 'Schools' : expandedLeagueType === 'country' ? 'Countries' : 'Teams'}
                </h2>
                {loadingTeams ? (
                  <div className="flex items-center justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5">
                    {getExpandedLeagueTeams().map(item => renderEntityCard(item, expandedLeagueType))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Trending Players at root */}
              {currentParentId === null && (
                <>
                  <TrendingPlayers userId={userId} followedPersonIds={followedPersonIds} hours={2} onPersonFollowed={(personId) => { setFollowedPersonIds(prev => { const next = new Set(prev); if (next.has(personId)) next.delete(personId); else next.add(personId); return next; }); }} />
                  <TrendingPlayers userId={userId} followedPersonIds={followedPersonIds} hours={24} onPersonFollowed={(personId) => { setFollowedPersonIds(prev => { const next = new Set(prev); if (next.has(personId)) next.delete(personId); else next.add(personId); return next; }); }} />
                </>
              )}

              {/* Card grid grouped by sections */}
              {currentLabel && <h2 className="text-xl font-bold text-center mb-3">{currentLabel}</h2>}
              {(() => {
                // Group items into sections by headings
                const sections: { heading: string | null; items: MenuItem[] }[] = [];
                let currentSection: { heading: string | null; items: MenuItem[] } = { heading: null, items: [] };

                currentItems.forEach(item => {
                  const displayOptions = item.display_options as { route?: string } | null;
                  const hasCustomRoute = !!displayOptions?.route;
                  const isHeading = !item.entity_type && !item.is_submenu && !hasChildren(item) && !hasCustomRoute;

                  if (isHeading) {
                    // Push previous section if it has items
                    if (currentSection.items.length > 0) sections.push(currentSection);
                    currentSection = { heading: item.label, items: [] };
                  } else {
                    currentSection.items.push(item);
                  }
                });
                // Push last section
                if (currentSection.items.length > 0) sections.push(currentSection);

                if (sections.length === 0) {
                  return <div className="bg-card rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-3"><p className="text-center text-muted-foreground py-8">No items to display</p></div>;
                }

                return sections.map((section, idx) => (
                  <div key={idx} className="bg-card rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-3">
                    {section.heading && <h3 className="text-lg font-bold text-foreground mb-2 text-center">{section.heading}</h3>}
                    <div className="grid grid-cols-3 gap-2">
                      {section.items.map(item => renderItemCard(item))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
