import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import ArticlePlaceholder from "@/components/ArticlePlaceholder";
import ArticleImage from "@/components/ArticleImage";
import FeedSkeleton from "@/components/FeedSkeleton";
import MatchedInterestBadges from "@/components/MatchedInterestBadges";
import { FocusedFeedHeader } from "@/components/FocusedFeedHeader";

import { useArticleFeed, useInvalidateArticleFeed, FeedRow } from "@/hooks/useArticleFeed";
import { openUrl } from "@/hooks/useOpenUrl";
import { MobileSidebar } from "@/components/MobileSidebar";
import { FeedAd } from "@/components/ads/FeedAd";

// How many articles between ads
const AD_FREQUENCY = 5;

// Preload images in the background
const preloadImages = (urls: string[]) => {
  urls.forEach(url => {
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

  // Parse focus parameters - supports both old interestId format and new type+id format
  const focusParam = searchParams.get("focus");
  const interestId = focusParam ? parseInt(focusParam) : undefined;

  // New type + id based focus (no favorite required)
  const entityType = searchParams.get("type");
  const entityIdParam = searchParams.get("id");
  const entityId = entityIdParam ? parseInt(entityIdParam) : undefined;

  // Optional league filter for schools (e.g., Virginia NCAAF vs Virginia NCAAM)
  const leagueIdParam = searchParams.get("leagueId");
  const focusLeagueId = leagueIdParam ? parseInt(leagueIdParam) : undefined;

  // Fetch feed with optional focus parameters
  const {
    data: initialArticles,
    isLoading,
    refetch,
    isError,
    error
  } = useArticleFeed(user?.id, interestId, entityType || undefined, entityId, focusLeagueId);
  const invalidateFeed = useInvalidateArticleFeed();

  // Combined articles: initial from React Query + any loaded via "Load More"
  const articles = [...(initialArticles || []), ...extraArticles];

  useEffect(() => {
    checkUser();
  }, []);

  // Scroll to top when feed focus changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [interestId, entityType, entityId, focusLeagueId]);

  // Preload all thumbnail images in the background once articles load
  useEffect(() => {
    if (articles.length > 0) {
      const thumbnailUrls = articles.map(a => a.thumbnail_url).filter((url): url is string => !!url);
      preloadImages(thumbnailUrls);
    }
  }, [initialArticles, extraArticles]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    setCheckingAuth(false);

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
    const body: Record<string, unknown> = {
      limit: 100,
      cursor_time: cursor.time,
      cursor_id: cursor.id
    };

    if (interestId) body.interest_id = interestId;
    if (entityType) body.entity_type = entityType;
    if (entityId) body.entity_id = entityId;
    if (focusLeagueId) body.focus_league_id = focusLeagueId;

    const response = await supabase.functions.invoke("get-feed", { body });
    if (response.error) throw new Error(response.error.message);
    return (response.data ?? []) as FeedRow[];
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
      invalidateFeed(user.id, interestId, entityType || undefined, entityId, focusLeagueId);
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

  if (isError) {
    const message = error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error);
    // If the error is auth-related (session expired, unauthorized), redirect to login
    const isAuthError = message.toLowerCase().includes('not authenticated') ||
      message.toLowerCase().includes('no active session') ||
      message.toLowerCase().includes('session not found') ||
      message.toLowerCase().includes('non-2xx status code') ||
      message.toLowerCase().includes('unauthorized');
    if (isAuthError) {
      supabase.auth.signOut().then(() => navigate("/auth"));
      return <FeedSkeleton />;
    }
    return (
      <div className="min-h-screen">
        <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="container mx-auto px-3 py-2">
            <div className="flex items-center gap-2 md:hidden">
              <MobileSidebar />
              <h1 className="text-lg font-bold text-foreground">Feed Error</h1>
            </div>
            <h1 className="hidden md:block text-xl font-bold text-foreground text-center">Feed Error</h1>
          </div>
        </header>
        <main className="container mx-auto px-2 py-2">
          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="text-base font-semibold">Couldn't load articles</h2>
              <p className="text-sm text-muted-foreground break-words">{message}</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleRefresh} disabled={refreshing}>Retry</Button>
                <Button variant="outline" onClick={() => navigate("/preferences")}>Check Selections</Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col w-full overflow-hidden">
        <header className="border-b bg-background/80 backdrop-blur-sm z-10 flex-shrink-0">
          <div className="w-full px-1 md:px-3 py-1 flex items-center justify-between">
            {/* Mobile: hamburger on far left */}
            <div className="md:hidden flex-shrink-0">
              <MobileSidebar />
            </div>
            {/* Mobile: title centered with overflow handling */}
            <div className="md:hidden flex-1 min-w-0 mx-1 overflow-hidden">
              <FocusedFeedHeader 
                userId={user?.id}
                focusParam={focusParam}
                entityType={entityType}
                entityId={entityId}
                focusLeagueId={focusLeagueId}
              />
            </div>
            {/* Desktop: centered title */}
            <div className="hidden md:flex flex-1 justify-center">
              <FocusedFeedHeader 
                userId={user?.id}
                focusParam={focusParam}
                entityType={entityType}
                entityId={entityId}
                focusLeagueId={focusLeagueId}
              />
            </div>
            {/* Refresh button - all layouts, far right */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1 md:p-1.5 hover:bg-muted rounded-full transition-colors flex-shrink-0"
              aria-label="Refresh feed"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full px-0 md:px-2 py-2">
          {articles.length === 0 ? (
            <Card className="mx-2 md:mx-0">
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
            <div className="space-y-0">
              {articles.map((article, index) => (
                <div key={article.article_id}>
                  <Card className="overflow-hidden rounded-none border-0 shadow-none">
                    <CardContent className="p-0">
                      <button
                        type="button"
                        onClick={() => openUrl(article.url)}
                        className="block w-full text-left hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <div className="w-full">
                            {article.thumbnail_url ? (
                              <ArticleImage src={article.thumbnail_url} className="w-full aspect-video object-cover" />
                            ) : (
                              <ArticlePlaceholder />
                            )}
                          </div>

                          <div className="px-3 pt-1.5 pb-2">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mb-0.5">
                              <span>{article.url_domain || article.domain || 'Unknown source'}</span>
                              <span>•</span>
                              <span>{formatTimeAgo(article.published_effective)}</span>
                              <MatchedInterestBadges interests={article.matched_interests} />
                            </div>

                            <h3 className="font-semibold text-sm line-clamp-3">
                              {article.title}
                            </h3>
                          </div>
                        </div>
                      </button>
                    </CardContent>
                  </Card>
                  
                  {/* Insert ad after every AD_FREQUENCY articles */}
                  {(index + 1) % AD_FREQUENCY === 0 && (
                    <FeedAd key={`ad-${index}`} />
                  )}
                </div>
              ))}
              {articles.length >= 100 && (
                <div className="flex justify-center pt-4">
                  <Button className="w-full md:w-auto" onClick={loadMore} disabled={loadingMore} variant="outline">
                    {loadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </>
                    ) : "Load More"}
                  </Button>
                </div>
              )}
            </div>
          )}
      </main>
    </div>
  );
}
