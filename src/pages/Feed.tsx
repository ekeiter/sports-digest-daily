import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
  const [articles, setArticles] = useState<FeedRow[]>([]);

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
    
    await fetchFeed(7);
  };

  const fetchFeed = async (daysBack = 7, cursor?: { time: string; id: number } | null) => {
    try {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const since = new Date(Date.now() - daysBack * 24 * 3600 * 1000).toISOString();
      const uid = user?.id || (await supabase.auth.getUser()).data.user!.id;

      const args: any = { p_subscriber_id: uid, p_since: since, p_limit: 50 };
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
    await fetchFeed(7, { time: last.published_effective, id: last.article_id });
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
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
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">My Sports Feed</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/preferences")}>
                Manage Interests
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {articles.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <h2 className="text-xl font-semibold mb-2">No articles yet</h2>
              <p className="text-muted-foreground mb-4">
                Follow some teams or topics to see personalized sports news here.
              </p>
              <Button onClick={() => navigate("/preferences")}>
                Follow Teams & Topics
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <Card key={article.article_id}>
                <CardContent className="p-4">
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex gap-4 hover:opacity-80 transition-opacity"
                  >
                    {article.thumbnail_url && (
                      <img 
                        src={article.thumbnail_url} 
                        alt=""
                        className="w-32 h-24 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 line-clamp-2">
                        {article.title}
                      </h3>
                      <div className="flex gap-2 text-sm text-muted-foreground">
                        {article.domain && <span>{article.domain}</span>}
                        <span>•</span>
                        <span>{formatTimeAgo(article.published_effective)}</span>
                      </div>
                    </div>
                  </a>
                </CardContent>
              </Card>
            ))}
            
            {articles.length >= 50 && (
              <div className="flex justify-center pt-4">
                <Button 
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
