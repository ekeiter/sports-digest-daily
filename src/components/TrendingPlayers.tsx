import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Loader2, TrendingUp, ChevronDown, ChevronUp, Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useInvalidateUserPreferences } from "@/hooks/useUserPreferences";
import { useInvalidateArticleFeed } from "@/hooks/useArticleFeed";

interface TrendingPerson {
  id: number;
  name: string;
  article_count: number;
  sport: string | null;
  league: string | null;
  team: string | null;
  school: string | null;
  role: string | null;
  position: string | null;
  logo_url: string | null;
  country_logo_url: string | null;
}

interface TrendingPlayersProps {
  userId: string | null;
  followedPersonIds: Set<number>;
  onPersonFollowed?: (personId: number) => void;
}

export default function TrendingPlayers({ 
  userId, 
  followedPersonIds,
  onPersonFollowed 
}: TrendingPlayersProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [trendingPeople, setTrendingPeople] = useState<TrendingPerson[]>([]);
  const invalidatePreferences = useInvalidateUserPreferences();
  const invalidateFeed = useInvalidateArticleFeed();

  useEffect(() => {
    if (expanded && trendingPeople.length === 0) {
      loadTrendingPeople();
    }
  }, [expanded]);

  const loadTrendingPeople = async () => {
    setLoading(true);
    try {
      // Get trending people from last 2 hours
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      
      // First, get recent article IDs
      const { data: recentArticles, error: articlesError } = await supabase
        .from("articles")
        .select("id")
        .gte("published_at", twoHoursAgo);
      
      if (articlesError) throw articlesError;
      
      if (!recentArticles || recentArticles.length === 0) {
        setTrendingPeople([]);
        setLoading(false);
        return;
      }
      
      const articleIds = recentArticles.map(a => a.id);
      
      // Get person mappings for those articles (batch if needed)
      const { data: mappings, error: mappingsError } = await supabase
        .from("article_person_map")
        .select("person_id, article_id")
        .in("article_id", articleIds.slice(0, 1000)); // Limit to avoid query size issues
      
      if (mappingsError) throw mappingsError;
      
      if (!mappings || mappings.length === 0) {
        setTrendingPeople([]);
        setLoading(false);
        return;
      }
      
      // Count articles per person
      const personCounts: Record<number, number> = {};
      for (const mapping of mappings) {
        const personId = mapping.person_id;
        personCounts[personId] = (personCounts[personId] || 0) + 1;
      }
      
      // Sort by count and take top 20
      const sortedPersonIds = Object.entries(personCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([id]) => parseInt(id));
      
      if (sortedPersonIds.length === 0) {
        setTrendingPeople([]);
        setLoading(false);
        return;
      }
      
      // Fetch person details
      const { data: peopleData, error: peopleError } = await supabase
        .from("people")
        .select(`
          id,
          name,
          role,
          position,
          sport_id,
          sports (sport, logo_url),
          league_id,
          leagues (code, logo_url),
          team_id,
          teams (display_name, logo_url),
          school_id,
          schools (name, short_name, logo_url),
          country_code
        `)
        .in("id", sortedPersonIds);
      
      if (peopleError) throw peopleError;
      
      // Get country logos if needed
      const countryCodes = [...new Set(
        (peopleData || []).filter(p => p.country_code).map(p => p.country_code)
      )] as string[];
      
      let countriesMap: Map<string, string> = new Map();
      if (countryCodes.length > 0) {
        const { data: countries } = await supabase
          .from("countries")
          .select("code, logo_url")
          .in("code", countryCodes);
        countriesMap = new Map((countries || []).map(c => [c.code, c.logo_url]));
      }
      
      // Build the result with article counts, maintaining sort order
      const result: TrendingPerson[] = sortedPersonIds.map(personId => {
        const person = (peopleData || []).find(p => p.id === personId);
        if (!person) return null;
        
        // Get logo priority: team > school > league > sport
        let logo_url: string | null = null;
        if (person.teams?.logo_url) logo_url = person.teams.logo_url;
        else if (person.schools?.logo_url) logo_url = person.schools.logo_url;
        else if (person.leagues?.logo_url) logo_url = person.leagues.logo_url;
        else if (person.sports?.logo_url) logo_url = person.sports.logo_url;
        
        return {
          id: person.id,
          name: person.name,
          article_count: personCounts[personId],
          sport: person.sports?.sport || null,
          league: person.leagues?.code || null,
          team: person.teams?.display_name || null,
          school: person.schools?.short_name || null,
          role: person.role,
          position: person.position,
          logo_url,
          country_logo_url: person.country_code ? countriesMap.get(person.country_code) || null : null,
        };
      }).filter(Boolean) as TrendingPerson[];
      
      setTrendingPeople(result);
    } catch (error) {
      console.error("Error loading trending people:", error);
      toast.error("Failed to load trending players");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (person: TrendingPerson) => {
    if (!userId) return;
    
    const { error } = await supabase
      .from("subscriber_interests")
      .insert({
        subscriber_id: userId,
        person_id: person.id,
        notification_enabled: true,
        priority: 1
      });
    
    if (error) {
      toast.error("Failed to follow");
      return;
    }
    
    toast.success(`Now following ${person.name}`);
    onPersonFollowed?.(person.id);
    invalidatePreferences(userId);
    invalidateFeed(userId);
  };

  const handleNavigateToFocus = (personId: number) => {
    navigate(`/feed?type=person&id=${personId}`);
  };

  const getContextDisplay = (person: TrendingPerson) => {
    const parts: string[] = [];
    if (person.team) parts.push(person.team);
    else if (person.school) parts.push(person.school);
    if (person.league) parts.push(person.league);
    if (person.position) parts.push(person.position);
    return parts.join(" • ");
  };

  return (
    <div className="space-y-1">
      {/* Collapsible header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg border bg-card border-muted-foreground/30 hover:bg-accent transition-colors select-none"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="text-sm font-bold">Trending Players</span>
          <span className="text-[10px] text-foreground leading-tight text-left">article mentions<br />in last 2 hours</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="ml-2 border-l-2 border-muted-foreground/20 pl-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : trendingPeople.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2 px-2">
              No trending players in the last 2 hours
            </p>
          ) : (
            trendingPeople.map((person) => {
              const isFollowed = followedPersonIds.has(person.id);
              return (
                <div
                  key={person.id}
                  className="flex items-center gap-1.5 py-0.5 px-1.5 rounded-lg border bg-card border-muted-foreground/30 select-none"
                >
                  {/* Logo */}
                  {person.logo_url && (
                    <div className="flex items-center justify-center w-8 h-8 shrink-0">
                      <img
                        src={person.logo_url}
                        alt=""
                        className="h-7 w-7 object-contain"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                  )}
                  
                  {/* Name and context - clickable for navigation */}
                  <div
                    onClick={() => handleNavigateToFocus(person.id)}
                    className="flex flex-col min-w-0 flex-1 cursor-pointer"
                  >
                    <span className="text-xs lg:text-sm font-medium truncate flex items-center gap-1.5">
                      {person.name}
                      {person.role === 'coach' && (
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">Coach</span>
                      )}
                      {person.country_logo_url && (
                        <img
                          src={person.country_logo_url}
                          alt=""
                          className="h-3.5 w-5 object-contain flex-shrink-0"
                        />
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {getContextDisplay(person)}
                    </span>
                  </div>
                  
                  {/* Article count badge */}
                  <span className="text-xs font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">
                    {person.article_count}
                  </span>
                  
                  {/* Heart toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isFollowed) {
                        handleFollow(person);
                      }
                    }}
                    className="shrink-0 p-1 rounded-md hover:bg-muted/50 transition-colors"
                    title={isFollowed ? "Already following" : "Add to favorites"}
                    disabled={isFollowed}
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        isFollowed
                          ? 'fill-red-500 text-red-500'
                          : 'text-muted-foreground hover:text-red-500'
                      }`}
                    />
                  </button>
                </div>
              );
            })
          )}
          
          {/* Refresh button */}
          {!loading && trendingPeople.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={loadTrendingPeople}
              className="w-full text-xs text-muted-foreground"
            >
              Refresh
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
