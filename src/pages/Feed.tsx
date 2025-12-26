import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
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
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [extraArticles, setExtraArticles] = useState<FeedRow[]>([]);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const { data: initialArticles, isLoading, refetch } = useArticleFeed(user?.id);
  const invalidateFeed = useInvalidateArticleFeed();

  // Combined articles: initial from React Query + any loaded via "Load More"
  const articles = [...(initialArticles || []), ...extraArticles];

  useEffect(() => {
    checkUser();
  }, []);

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
    
    // Check if focus mode is active
    await checkFocusMode(user.id);
  };

  const checkFocusMode = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("subscriber_interests")
        .select("is_focused")
        .eq("subscriber_id", userId)
        .eq("is_focused", true)
        .limit(1);
      
      setIsFocusMode(data && data.length > 0);
    } catch (error) {
      console.error("Error checking focus mode:", error);
    }
  };

  const fetchMoreArticles = async (cursor: { time: string; id: number }) => {
    const args: any = { 
      p_subscriber_id: user.id, 
      p_limit: 100,
      p_cursor_time: cursor.time,
      p_cursor_id: cursor.id 
    };

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
            <h1 className="text-xl md:text-2xl font-bold text-center text-black">
              <span className="font-racing text-2xl md:text-3xl">SportsDig</span> <span className="text-lg md:text-xl">- My Feed{isFocusMode ? <span className="text-red-500"> - Focused</span> : ""}</span>
            </h1>
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
