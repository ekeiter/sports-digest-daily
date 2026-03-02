import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Loader2, TrendingUp, Heart } from "lucide-react";
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

type TimeWindow = 2 | 24;

export default function TrendingPlayers({ 
  userId, 
  followedPersonIds,
  onPersonFollowed,
}: TrendingPlayersProps) {
  const navigate = useNavigate();
  const [activeWindow, setActiveWindow] = useState<TimeWindow | null>(null);
  const [loading, setLoading] = useState(false);
  const [trendingPeople, setTrendingPeople] = useState<TrendingPerson[]>([]);
  const invalidatePreferences = useInvalidateUserPreferences();
  const invalidateFeed = useInvalidateArticleFeed();

  const loadTrendingPeople = useCallback(async (hours: TimeWindow) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_trending_people', {
        p_hours: hours,
        p_limit: 20
      });
      if (error) throw error;
      if (!data || data.length === 0) {
        setTrendingPeople([]);
        setLoading(false);
        return;
      }
      const result: TrendingPerson[] = data.map((row: any) => {
        let logo_url: string | null = null;
        if (row.team_logo_url) logo_url = row.team_logo_url;
        else if (row.school_logo_url) logo_url = row.school_logo_url;
        else if (row.league_logo_url) logo_url = row.league_logo_url;
        else if (row.sport_logo_url) logo_url = row.sport_logo_url;
        return {
          id: row.person_id,
          name: row.person_name,
          article_count: row.article_count,
          sport: row.sport_name,
          league: row.league_code,
          team: row.team_name,
          school: row.school_short_name,
          role: row.person_role,
          position: row.person_position,
          logo_url,
          country_logo_url: row.country_logo_url,
        };
      });
      setTrendingPeople(result);
    } catch (error) {
      console.error("Error loading trending people:", error);
      toast.error("Failed to load trending players");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggle = (window: TimeWindow) => {
    if (activeWindow === window) {
      setActiveWindow(null);
      setTrendingPeople([]);
    } else {
      setActiveWindow(window);
      loadTrendingPeople(window);
    }
  };

  const handleFollow = async (person: TrendingPerson) => {
    if (!userId) return;
    const { error } = await supabase
      .from("subscriber_interests")
      .insert({ subscriber_id: userId, person_id: person.id, notification_enabled: true, priority: 1 });
    if (error) { toast.error("Failed to follow"); return; }
    toast.success(`Now following ${person.name}`);
    onPersonFollowed?.(person.id);
    invalidatePreferences(userId);
    invalidateFeed(userId);
  };

  const handleUnfollow = async (person: TrendingPerson) => {
    if (!userId) return;
    const { error } = await supabase
      .from("subscriber_interests")
      .delete()
      .eq("subscriber_id", userId)
      .eq("person_id", person.id);
    if (error) { toast.error("Failed to unfollow"); return; }
    toast.success(`Unfollowed ${person.name}`);
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
    return parts.join(" • ");
  };

  const btnBase = "px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors";
  const btnActive = "bg-foreground text-background";
  const btnInactive = "bg-[#F4F4F4] text-muted-foreground hover:bg-muted";

  return (
    <div className="space-y-1">
      {/* Header row */}
      <div className="flex items-center justify-between py-1.5 px-2 rounded-lg border bg-card border-muted-foreground/30">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          <span className="text-sm font-bold">Trending Players</span>
          <span className="text-[11px] text-muted-foreground">— Article Mentions</span>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => handleToggle(2)}
            className={`${btnBase} ${activeWindow === 2 ? btnActive : btnInactive}`}
          >
            2 Hours
          </button>
          <button
            onClick={() => handleToggle(24)}
            className={`${btnBase} ${activeWindow === 24 ? btnActive : btnInactive}`}
          >
            24 Hours
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {activeWindow !== null && (
        <div className="ml-2 border-l-2 border-muted-foreground/20 pl-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : trendingPeople.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2 px-2">
              No trending players in the last {activeWindow} hours
            </p>
          ) : (
            trendingPeople.map((person) => {
              const isFollowed = followedPersonIds.has(person.id);
              return (
                <div
                  key={person.id}
                  className="flex items-center gap-1.5 py-0.5 px-1.5 rounded-lg border bg-card border-muted-foreground/30 select-none"
                >
                  {person.logo_url && (
                    <div className="flex items-center justify-center w-8 h-8 shrink-0">
                      <img src={person.logo_url} alt="" className="h-7 w-7 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                  <div onClick={() => handleNavigateToFocus(person.id)} className="flex flex-col min-w-0 flex-1 cursor-pointer">
                    <span className="text-xs lg:text-sm font-medium truncate flex items-center gap-1.5">
                      {person.name}
                      {person.position && <span className="text-muted-foreground font-normal">• {person.position}</span>}
                      {person.country_logo_url && <img src={person.country_logo_url} alt="" className="h-3.5 w-5 object-contain flex-shrink-0" />}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">{getContextDisplay(person)}</span>
                  </div>
                  <span className="text-xs font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">{person.article_count}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); isFollowed ? handleUnfollow(person) : handleFollow(person); }}
                    className="shrink-0 p-1 rounded-md hover:bg-muted/50 transition-colors"
                    title={isFollowed ? "Unfollow" : "Add to favorites"}
                  >
                    <Heart className={`h-5 w-5 ${isFollowed ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'}`} />
                  </button>
                </div>
              );
            })
          )}
          {!loading && trendingPeople.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => loadTrendingPeople(activeWindow)} className="w-full text-xs text-muted-foreground">
              Refresh
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
