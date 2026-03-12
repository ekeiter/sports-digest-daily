import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Loader2, TrendingUp, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useInvalidateUserPreferences } from "@/hooks/useUserPreferences";
import { useInvalidateArticleFeed } from "@/hooks/useArticleFeed";

interface TrendingTeamEntity {
  entity_type: "team" | "school" | "country";
  entity_id: number;
  entity_name: string;
  article_count: number;
  logo_url: string | null;
  league_code: string | null;
  league_logo_url: string | null;
  league_id: number | null;
}

interface TrendingTeamsProps {
  userId: string | null;
  selectedTeams: number[];
  selectedSchools: number[];
  selectedCountries: number[];
  onEntityFollowed?: (entityType: string, entityId: number) => void;
}

type TimeWindow = 2 | 24;

export default function TrendingTeams({
  userId,
  selectedTeams,
  selectedSchools,
  selectedCountries,
  onEntityFollowed,
}: TrendingTeamsProps) {
  const navigate = useNavigate();
  const [activeWindow, setActiveWindow] = useState<TimeWindow | null>(null);
  const [loading, setLoading] = useState(false);
  const [trendingEntities, setTrendingEntities] = useState<TrendingTeamEntity[]>([]);
  const invalidatePreferences = useInvalidateUserPreferences();
  const invalidateFeed = useInvalidateArticleFeed();

  const loadTrending = useCallback(async (hours: TimeWindow) => {
    setLoading(true);
    try {
      const limit = hours === 24 ? 30 : 20;
      const { data, error } = await supabase.rpc("get_trending_teams", {
        p_hours: hours,
        p_limit: limit,
      });
      if (error) throw error;
      if (!data || data.length === 0) {
        setTrendingEntities([]);
        setLoading(false);
        return;
      }
      const result: TrendingTeamEntity[] = data.map((row: any) => ({
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        entity_name: row.entity_name,
        article_count: row.article_count,
        logo_url: row.logo_url,
        league_code: row.league_code,
        league_logo_url: row.league_logo_url,
        league_id: row.league_id,
      }));
      setTrendingEntities(result);
    } catch (error) {
      console.error("Error loading trending teams:", error);
      toast.error("Failed to load trending teams");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggle = (window: TimeWindow) => {
    if (activeWindow === window) {
      setActiveWindow(null);
      setTrendingEntities([]);
    } else {
      setActiveWindow(window);
      loadTrending(window);
    }
  };

  const isFollowed = (entity: TrendingTeamEntity): boolean => {
    if (entity.entity_type === "team") return selectedTeams.includes(entity.entity_id);
    if (entity.entity_type === "school") return selectedSchools.includes(entity.entity_id);
    if (entity.entity_type === "country") return selectedCountries.includes(entity.entity_id);
    return false;
  };

  const handleFollow = async (entity: TrendingTeamEntity) => {
    if (!userId) return;
    const insert: any = { subscriber_id: userId, notification_enabled: true, priority: 1 };
    if (entity.entity_type === "team") insert.team_id = entity.entity_id;
    else if (entity.entity_type === "school") insert.school_id = entity.entity_id;
    else if (entity.entity_type === "country") {
      insert.country_id = entity.entity_id;
      if (entity.league_id) insert.league_id = entity.league_id;
    }

    const { error } = await supabase.from("subscriber_interests").insert(insert);
    if (error) { toast.error("Failed to follow"); return; }
    toast.success(`Now following ${entity.entity_name}`);
    onEntityFollowed?.(entity.entity_type, entity.entity_id);
    invalidatePreferences(userId);
    invalidateFeed(userId);
  };

  const handleUnfollow = async (entity: TrendingTeamEntity) => {
    if (!userId) return;
    let query = supabase.from("subscriber_interests").delete().eq("subscriber_id", userId);
    if (entity.entity_type === "team") query = query.eq("team_id", entity.entity_id);
    else if (entity.entity_type === "school") query = query.eq("school_id", entity.entity_id);
    else if (entity.entity_type === "country") {
      query = query.eq("country_id", entity.entity_id);
      if (entity.league_id) query = query.eq("league_id", entity.league_id);
    }

    const { error } = await query;
    if (error) { toast.error("Failed to unfollow"); return; }
    toast.success(`Unfollowed ${entity.entity_name}`);
    onEntityFollowed?.(entity.entity_type, entity.entity_id);
    invalidatePreferences(userId);
    invalidateFeed(userId);
  };

  const handleNavigateToFocus = (entity: TrendingTeamEntity) => {
    navigate(`/feed?type=${entity.entity_type}&id=${entity.entity_id}`);
  };

  const btnBase = "px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors";
  const btnActive = "bg-foreground text-background dark:bg-favorite-card dark:text-primary-foreground";
  const btnInactive = "bg-muted text-foreground hover:bg-accent border border-muted-foreground/30 dark:bg-favorite-card dark:text-primary-foreground dark:border-favorite-card-border";

  return (
    <div className="space-y-1">
      {/* Header box */}
      <div className="py-1.5 px-2 rounded-lg border bg-card border-muted-foreground/30 space-y-1.5">
        <div className="flex items-center justify-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          <span className="text-sm font-bold">Trending Teams — Article Mentions</span>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => handleToggle(2)}
            className={`${btnBase} flex-1 ${activeWindow === 2 ? btnActive : btnInactive}`}
          >
            2 Hours
            {activeWindow === 2 ? <ChevronUp className="h-3.5 w-3.5 ml-1 inline" /> : <ChevronDown className="h-3.5 w-3.5 ml-1 inline" />}
          </button>
          <button
            onClick={() => handleToggle(24)}
            className={`${btnBase} flex-1 ${activeWindow === 24 ? btnActive : btnInactive}`}
          >
            24 Hours
            {activeWindow === 24 ? <ChevronUp className="h-3.5 w-3.5 ml-1 inline" /> : <ChevronDown className="h-3.5 w-3.5 ml-1 inline" />}
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
          ) : trendingEntities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2 px-2">
              No trending teams in the last {activeWindow} hours
            </p>
          ) : (
            trendingEntities.map((entity) => {
              const followed = isFollowed(entity);
              return (
                <div
                  key={`${entity.entity_type}-${entity.entity_id}`}
                  className="no-logo-glow flex items-center gap-1.5 py-0.5 px-1.5 rounded-lg border bg-card dark:bg-favorite-card dark:border-favorite-card-border dark:text-primary-foreground border-muted-foreground/30 select-none"
                >
                  {entity.logo_url && (
                    <div className="flex items-center justify-center w-8 h-8 shrink-0">
                      <img src={entity.logo_url} alt="" className="h-7 w-7 object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
                    </div>
                  )}
                  <div onClick={() => handleNavigateToFocus(entity)} className="flex flex-col min-w-0 flex-1 cursor-pointer">
                    <span className="text-xs lg:text-sm font-medium truncate flex items-center gap-1.5">
                      {entity.entity_name}
                    </span>
                    {entity.league_code && (
                      <span className="text-xs text-muted-foreground dark:text-primary-foreground/70 truncate flex items-center gap-1">
                        {entity.league_code}
                        {entity.league_logo_url && (
                          <img src={entity.league_logo_url} alt="" className="h-3.5 w-3.5 object-contain inline-block" />
                        )}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold bg-primary/10 text-primary dark:text-primary-foreground px-1.5 py-0.5 rounded shrink-0">
                    {entity.article_count}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      followed ? handleUnfollow(entity) : handleFollow(entity);
                    }}
                    className="shrink-0 p-1 rounded-md hover:bg-muted/50 transition-colors"
                    title={followed ? "Unfollow" : "Add to favorites"}
                  >
                    <Heart className={`h-5 w-5 ${followed ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-500"}`} />
                  </button>
                </div>
              );
            })
          )}
          {!loading && trendingEntities.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => loadTrending(activeWindow)} className="w-full text-xs text-muted-foreground">
              Refresh
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
