import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import sportsdigLogo from "@/assets/sportsdig-logo.jpg";

type FeedRow = {
  article_id: number;
  title: string;
  url: string;
  thumbnail_url: string | null;
  domain: string | null;
  published_effective: string;
  published_at: string | null;
  updated_at: string | null;
};

export default function Feed() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [articles, setArticles] = useState<FeedRow[]>([]);
  const [isFocusMode, setIsFocusMode] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    
    // Ensure subscriber record exists
    try {
      await supabase.rpc('ensure_my_subscriber');
    } catch (error) {
      console.error("Error ensuring subscriber:", error);
    }
    
    // Check if focus mode is active
    await checkFocusMode(user.id);
    
    await fetchFeed();
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

  const fetchFeed = async (cursor?: { time: string; id: number } | null) => {
    try {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const uid = user?.id || (await supabase.auth.getUser()).data.user!.id;

      const args: any = { p_subscriber_id: uid, p_limit: 100 };
      if (cursor) {
        args.p_cursor_time = cursor.time;
        args.p_cursor_id = cursor.id;
      }

      const { data, error } = await supabase.rpc('get_subscriber_feed' as any, args);
      if (error) throw error;

      const feedData = (data ?? []) as FeedRow[];
      
      if (cursor) {
        setArticles(prev => [...prev, ...feedData]);
      } else {
        setArticles(feedData);
      }
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = async () => {
    if (articles.length === 0) return;
    const last = articles[articles.length - 1];
    await fetchFeed({ time: last.published_effective, id: last.article_id });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setArticles([]);
    await fetchFeed();
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container mx-auto px-3 py-2 max-w-3xl">
          <div className="flex flex-col gap-2">
            <h1 className="text-lg font-bold text-center">
              SportsDig Feed{isFocusMode ? " - Focused" : ""}
            </h1>
            <div className="flex gap-1.5 justify-center">
              <Button size="sm" className="h-7 px-3" onClick={() => navigate("/")}>
                Dashboard
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
                        <img 
                          src={article.thumbnail_url || sportsdigLogo} 
                          alt=""
                          className="w-full aspect-video object-cover"
                          loading="lazy"
                        />
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
