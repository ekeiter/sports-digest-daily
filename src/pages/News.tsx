import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, ExternalLink, Calendar, Clock, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchUnifiedNews } from "@/lib/universalNewsAggregator";

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  } | string;
  author: string;
  paywalled?: boolean;
}

interface NewsResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

const News = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalResults, setTotalResults] = useState(0);
  const [loadedPersonalized, setLoadedPersonalized] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Load personalized news based on user preferences
    loadPersonalizedNews();
  }, []);

  const loadPersonalizedNews = async () => {
    setLoading(true);
    try {
      console.log("📱 Loading personalized news from cache...");
      
      // Fetch user preferences
      const [teamsRes, playersRes, sportsRes] = await Promise.all([
        supabase.from('user_teams').select('team_name, league'),
        supabase.from('user_players').select('player_name, sport'),
        supabase.from('user_sports').select('sport_name')
      ]);

      const topics = [];
      
      // Add team names with their leagues
      if (teamsRes.data) {
        teamsRes.data.forEach(team => {
          topics.push(`${team.team_name} ${team.league}`);
          topics.push(team.team_name); // Also add just the team name
        });
      }
      
      // Add sports
      if (sportsRes.data) {
        sportsRes.data.forEach(sport => {
          topics.push(sport.sport_name);
        });
      }
      
      // Add players with their sports
      if (playersRes.data) {
        playersRes.data.forEach(player => {
          topics.push(`${player.player_name} ${player.sport}`);
          topics.push(player.player_name); // Also add just the player name
        });
      }

      if (topics.length === 0) {
        toast({
          title: "No preferences set",
          description: "Please add teams, players, or sports to your preferences first",
        });
        setLoading(false);
        return;
      }

      console.log("🎯 Searching cached articles for topics:", topics);

      // Call the cached articles function first
      const { data, error } = await supabase.functions.invoke('get-cached-articles', {
        body: { topics }
      });

      if (error) {
        console.error('❌ Error calling get-cached-articles:', error);
        toast({
          title: "Error",
          description: "Failed to fetch personalized news",
          variant: "destructive",
        });
        return;
      }

      console.log("📰 Cached articles response:", data);

      // Transform the articles to match our interface
      const transformedArticles = (data.articles || []).map((article: any) => ({
        title: article.title,
        description: article.description || "",
        url: article.url,
        urlToImage: "", // Cached articles don't have images
        publishedAt: article.publishedAt,
        source: article.source,
        author: "",
        paywalled: article.paywalled || false
      }));

      setArticles(transformedArticles);
      setTotalResults(transformedArticles.length);
      setLoadedPersonalized(true);

      console.log('✅ Loaded', transformedArticles.length, "cached articles");

      // If we have few or no cached articles, refresh from APIs
      if (transformedArticles.length < 10) {
        console.log("🔄 Low cached article count, refreshing from APIs...");
        await refreshFromAPIs(topics);
      } else if (transformedArticles.length === 0) {
        toast({
          title: "No articles found",
          description: "Try refreshing or add more teams, sports, or players to your preferences",
        });
      }
    } catch (error) {
      console.error('❌ Error loading personalized news:', error);
      toast({
        title: "Error",
        description: "Failed to fetch personalized news",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshFromAPIs = async (topics: string[]) => {
    try {
      console.log("🔄 Refreshing articles from APIs...");
      toast({
        title: "Refreshing News",
        description: "Fetching latest articles from news sources...",
      });
      
      // Call the unified news function to fetch fresh data and cache it
      const { data, error } = await supabase.functions.invoke('unified-news', {
        body: { topics }
      });

      if (error) {
        console.error("❌ Error calling unified-news:", error);
        return;
      }

      console.log("📰 Fresh articles from APIs:", data);

      if (data?.articles && Array.isArray(data.articles)) {
        // Now get the updated cached articles
        const { data: cachedData } = await supabase.functions.invoke('get-cached-articles', {
          body: { topics }
        });
        
        if (cachedData?.articles) {
          const transformedArticles = cachedData.articles.map((article: any) => ({
            title: article.title,
            description: article.description || "",
            url: article.url,
            urlToImage: "",
            publishedAt: article.publishedAt,
            source: article.source,
            author: "",
            paywalled: article.paywalled || false
          }));
          
          setArticles(transformedArticles);
          setTotalResults(transformedArticles.length);
          console.log("✅ Updated with", transformedArticles.length, "articles from cache");
          
          toast({
            title: "News Updated",
            description: `Loaded ${transformedArticles.length} fresh articles`,
          });
        }
      }
    } catch (error) {
      console.error("❌ Error refreshing from APIs:", error);
    }
  };

  const fetchNews = async (query: string) => {
    setLoading(true);
    setLoadedPersonalized(false);
    try {
      console.log("🔍 Searching cached articles for:", query);

      // Search in cached articles first
      const { data, error } = await supabase.functions.invoke('get-cached-articles', {
        body: { 
          searchQuery: query.trim()
        }
      });

      if (error) {
        console.error("❌ Error searching cached articles:", error);
        toast({
          title: "Search Error",
          description: "Failed to search for news. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log("📰 Cached search results:", data);

      if (data?.articles && Array.isArray(data.articles)) {
        // Transform the articles to match our interface
        const transformedArticles = data.articles.map((article: any) => ({
          title: article.title,
          description: article.description || "",
          url: article.url,
          urlToImage: "",
          publishedAt: article.publishedAt,
          source: article.source,
          author: "",
          paywalled: article.paywalled || false
        }));

        setArticles(transformedArticles);
        setTotalResults(transformedArticles.length);
        console.log("✅ Found", transformedArticles.length, "cached articles for search");
        
        if (transformedArticles.length < 5) {
          toast({
            title: "Limited Results",
            description: "Consider refreshing the news cache for more results",
          });
        }
      } else {
        console.log("⚠️ No cached articles found for query:", query);
        setArticles([]);
        setTotalResults(0);
        toast({
          title: "No Results",
          description: "No articles found for your search. Try different keywords.",
        });
      }
    } catch (error) {
      console.error("❌ Error searching news:", error);
      toast({
        title: "Search Error",
        description: "Failed to search for news. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchNews(searchQuery.trim());
    }
  };

  const handleRefreshPersonalized = () => {
    setSearchQuery("");
    loadPersonalizedNews();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const articleDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - articleDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return formatDate(dateString);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Sports News</h1>
          <div className="ml-auto flex items-center gap-4">
            {!loadedPersonalized && (
              <Button 
                variant="outline" 
                onClick={handleRefreshPersonalized}
                disabled={loading}
              >
                My News
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => {
                if (loadedPersonalized) {
                  // Get current topics and refresh from APIs
                  supabase.from('user_teams').select('team_name, league')
                    .then(teamsRes => supabase.from('user_players').select('player_name, sport')
                      .then(playersRes => supabase.from('user_sports').select('sport_name')
                        .then(sportsRes => {
                          const topics = [];
                          if (teamsRes.data) {
                            teamsRes.data.forEach(team => {
                              topics.push(`${team.team_name} ${team.league}`);
                              topics.push(team.team_name);
                            });
                          }
                          if (sportsRes.data) {
                            sportsRes.data.forEach(sport => topics.push(sport.sport_name));
                          }
                          if (playersRes.data) {
                            playersRes.data.forEach(player => {
                              topics.push(`${player.player_name} ${player.sport}`);
                              topics.push(player.player_name);
                            });
                          }
                          if (topics.length > 0) refreshFromAPIs(topics);
                        })
                      )
                    );
                } else {
                  handleRefreshPersonalized();
                }
              }}
              disabled={loading}
            >
              🔄 Refresh
            </Button>
            <Badge variant="secondary">
              {totalResults.toLocaleString()} articles found
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Info Banner */}
          {loadedPersonalized && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <p className="text-sm">
                  <strong>Personalized News:</strong> Showing articles based on your selected teams, sports, and players. 
                  Use the search below to find specific topics.
                </p>
              </CardContent>
            </Card>
          )}
          
          {/* Search Bar */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for specific sports news..."
                    onKeyPress={handleKeyPress}
                  />
                </div>
                <Button onClick={handleSearch} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* News Articles */}
          {loading ? (
            <div className="text-center py-8">
              <p className="text-lg">Loading news...</p>
            </div>
          ) : articles.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-lg text-muted-foreground">No articles found</p>
                <p className="text-sm text-muted-foreground">Try searching for different keywords</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {article.urlToImage && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={article.urlToImage}
                        alt={article.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {typeof article.source === 'string' ? article.source : article.source?.name || 'Unknown Source'}
                      </Badge>
                      {article.paywalled && (
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          Premium
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {getTimeAgo(article.publishedAt)}
                      </div>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">
                      {article.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {article.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {article.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(article.publishedAt)} at {formatTime(article.publishedAt)}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(article.url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {article.paywalled ? 'View Article' : 'Read'}
                      </Button>
                    </div>
                    {article.author && (
                      <p className="text-xs text-muted-foreground mt-2">
                        By {article.author}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default News;
