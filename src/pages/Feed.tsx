import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw, X } from "lucide-react";
import ArticlePlaceholder from "@/components/ArticlePlaceholder";
import FeedSkeleton from "@/components/FeedSkeleton";
import { useArticleFeed, useInvalidateArticleFeed, FeedRow } from "@/hooks/useArticleFeed";

// Preload images in the background
const preloadImages = (urls: string[]) => {
  urls.forEach((url) => {
    if (url) {
      const img = new Image();
      img.src = url;
    }
  });
};

export default function Feed() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [extraArticles, setExtraArticles] = useState<FeedRow[]>([]);
  const [focusLabel, setFocusLabel] = useState<string | null>(null);
  
  // Parse focus parameter (e.g., "team-123", "person-456")
  const focusParam = searchParams.get("focus");
  const [focusType, focusId] = focusParam?.split("-") ?? [null, null];

  // For focused feed, we'll use a different hook/query
  const { data: initialArticles, isLoading, refetch } = useArticleFeed(
    user?.id, 
    focusType && focusId ? { type: focusType, id: parseInt(focusId) } : undefined
  );
  const invalidateFeed = useInvalidateArticleFeed();

  // Combined articles: initial from React Query + any loaded via "Load More"
  const articles = [...(initialArticles || []), ...extraArticles];

  useEffect(() => {
    checkUser();
  }, []);

  // Fetch the label for the focused item
  useEffect(() => {
    if (focusType && focusId) {
      fetchFocusLabel();
    } else {
      setFocusLabel(null);
    }
  }, [focusType, focusId]);

  // Preload images after articles load
  useEffect(() => {
    if (articles.length > 0) {
      const imagesToPreload = articles
        .map(a => a.thumbnail_url)
        .filter((url): url is string => url !== null);
      
      const batchSize = 10;
      for (let i = 0; i < imagesToPreload.length; i += batchSize) {
        const batch = imagesToPreload.slice(i, i + batchSize);
        setTimeout(() => preloadImages(batch), (i / batchSize) * 100);
      }
    }
  }, [articles]);

  const fetchFocusLabel = async () => {
    if (!focusType || !focusId) return;
    
    try {
      let label = "";
      const id = parseInt(focusId);
      
      switch (focusType) {
        case "team": {
          const { data } = await supabase.from("teams").select("display_name").eq("id", id).single();
          label = data?.display_name || "Team";
          break;
        }
        case "league": {
          const { data } = await supabase.from("leagues").select("code, name").eq("id", id).single();
          label = data?.code || data?.name || "League";
          break;
        }
        case "sport": {
          const { data } = await supabase.from("sports").select("display_label, sport").eq("id", id).single();
          label = data?.display_label || data?.sport || "Sport";
          break;
        }
        case "person": {
          const { data } = await supabase.from("people").select("name").eq("id", id).single();
          label = data?.name || "Player";
          break;
        }
        case "school": {
          const { data } = await supabase.from("schools").select("short_name, name").eq("id", id).single();
          label = data?.short_name || data?.name || "School";
          break;
        }
        case "olympics": {
          label = "Olympics";
          break;
        }
      }
      
      setFocusLabel(label);
    } catch (error) {
      console.error("Error fetching focus label:", error);
      setFocusLabel(focusType);
    }
  };

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    setCheckingAuth(false);
    
    // Ensure subscriber record exists
    try {
      await supabase.rpc('ensure_my_subscriber');
    } catch (error) {
      console.error("Error ensuring subscriber:", error);
    }
  };

  const clearFocus = () => {
    setSearchParams({});
    setExtraArticles([]);
  };

  const fetchMoreArticles = async (cursor: { time: string; id: number }) => {
    const args: any = { 
      p_subscriber_id: user.id, 
      p_limit: 100,
      p_cursor_time: cursor.time,
      p_cursor_id: cursor.id 
    };
    
    // Add focus filter if present
    if (focusType && focusId) {
      args.p_focus_type = focusType;
      args.p_focus_id = parseInt(focusId);
    }

    const { data, error } = await supabase.rpc('get_subscriber_feed' as any, args);
    if (error) throw error;

    return (data ?? []) as FeedRow[];
  };

  const loadMore = async () => {
    if (articles.length === 0) return;
    const last = articles[articles.length - 1];
    
    setLoadingMore(true);
    try {
      const moreArticles = await fetchMoreArticles({ 
        time: last.published_effective, 
        id: last.article_id 
      });
      setExtraArticles(prev => [...prev, ...moreArticles]);
    } catch (error) {
      console.error("Error loading more:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setExtraArticles([]);
    if (user) {
      invalidateFeed(user.id);
    }
    await refetch();
    setRefreshing(false);
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const publishedDate = new Date(dateString);
      const now = new Date();
      const minutesAgo = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60));
      
      if (minutesAgo < 120) {
        return `${minutesAgo}m`;
      } else {
        const hoursAgo = Math.floor(minutesAgo / 60);
        if (hoursAgo < 24) {
          return `${hoursAgo}h`;
        } else {
          const daysAgo = Math.floor(hoursAgo / 24);
          return `${daysAgo}d`;
        }
      }
    } catch {
      return dateString;
    }
  };

  if (checkingAuth || isLoading) {
    return <FeedSkeleton />;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="container mx-auto px-3 py-2 max-w-3xl">
          <div className="flex flex-col gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-center text-foreground">
              <span className="font-racing text-2xl md:text-3xl">SportsDig</span> 
              <span className="text-lg md:text-xl">
                - My Feed
                {focusLabel && (
                  <span className="text-primary"> - {focusLabel}</span>
                )}
              </span>
            </h1>
            
            {/* Clear focus button when in focus mode */}
            {focusParam && (
              <div className="flex justify-center">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-6 px-2 text-xs gap-1"
                  onClick={clearFocus}
                >
                  <X className="h-3 w-3" />
                  Clear Focus
                </Button>
              </div>
            )}
            <div className="flex gap-1.5 justify-center">
              <Button size="sm" className="h-7 px-3" onClick={() => navigate("/")}>
                Dashboard
              </Button>
              <Button size="sm" className="h-7 px-3" onClick={() => navigate("/my-feeds")}>
                Selections
              </Button>
              <Button size="sm" className="h-7 px-3" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-1">Refresh</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 py-2 max-w-3xl">
        {articles.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <h2 className="text-xl font-semibold mb-2">No articles yet</h2>
              <p className="text-muted-foreground mb-4">
                Follow some teams or leagues to see personalized sports news here.
              </p>
              <Button onClick={() => navigate("/preferences")}>
                Follow Teams & Topics
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {articles.map((article) => (
              <Card key={article.article_id} className="overflow-hidden">
                <CardContent className="p-0">
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block hover:opacity-80 transition-opacity"
                  >
                      <div className="flex flex-col md:flex-row">
                      <div className="w-full md:w-64 md:flex-shrink-0">
                        {article.thumbnail_url ? (
                          <img 
                            src={article.thumbnail_url} 
                            alt=""
                            className="w-full aspect-video object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <ArticlePlaceholder />
                        )}
                      </div>
                      
                      <div className="px-3 pt-1.5 pb-2 md:flex md:flex-col md:justify-center">
                        <div className="flex gap-2 text-xs md:text-sm text-muted-foreground mb-0.5">
                          <span>{article.domain || 'Unknown source'}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(article.published_effective)}</span>
                          <span>•</span>
                          <span className="text-muted-foreground/60">{article.article_id}</span>
                        </div>
                        
                        <h3 className="font-semibold text-sm md:text-base line-clamp-3">
                          {article.title}
                        </h3>
                      </div>
                    </div>
                  </a>
                </CardContent>
              </Card>
            ))}
            
            {articles.length >= 100 && (
              <div className="flex justify-center pt-4">
                <Button 
                  className="w-full md:w-auto"
                  onClick={loadMore} 
                  disabled={loadingMore}
                  variant="outline"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
