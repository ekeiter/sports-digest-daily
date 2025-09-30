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

      // Get user's time preference
      const { data: configData } = await supabase
        .from('news_config')
        .select('hours_back')
        .single();
      
      const hoursBack = configData?.hours_back || 24;
      console.log("⏰ Using time preference:", hoursBack, "hours");

      // Call the cached articles function first
      const { data, error } = await supabase.functions.invoke('get-cached-articles', {
        body: { topics, hoursBack }
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
        urlToImage: article.urlToImage || "", // Now includes image from cached articles
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
            urlToImage: article.urlToImage || "",
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
          urlToImage: article.urlToImage || "",
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

  // Show article viewer if an article is selected

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="flex-shrink-0 bg-background border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold truncate">Sports News</h1>
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            {!loadedPersonalized && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefreshPersonalized}
                disabled={loading}
              >
                My News
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
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
              🔄
            </Button>
            <Badge variant="secondary" className="text-xs">
              {totalResults.toLocaleString()}
            </Badge>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2 space-y-2">
          {/* Info Banner */}
          {loadedPersonalized && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3">
                <p className="text-sm">
                  <strong>Personalized News:</strong> Showing articles based on your selected teams, sports, and players. 
                  Use the search below to find specific topics.
                </p>
              </CardContent>
            </Card>
          )}
          
          {/* Search Bar */}
          <Card>
            <CardContent className="p-4">
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
            <div className="text-center py-4">
              <p className="text-lg">Loading news...</p>
            </div>
          ) : articles.length === 0 ? (
            <Card>
              <CardContent className="text-center py-4">
                <p className="text-lg text-muted-foreground">No articles found</p>
                <p className="text-sm text-muted-foreground">Try searching for different keywords</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-1">
              {articles.map((article, index) => (
                <Card key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 shadow-lg hover:shadow-xl border border-blue-200 hover:border-blue-300">
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      {/* Article Image */}
                      {article.urlToImage && (
                        <div className="flex-shrink-0">
                          <img
                            src={article.urlToImage}
                            alt={article.title}
                            className="w-24 h-16 object-cover rounded-md"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Article Content */}
                      <div className="flex-1 space-y-1">
                        {/* Article Title Link */}
                         <a
                           href={article.url}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="block font-semibold text-link hover:text-link/80 transition-colors line-clamp-2"
                         >
                           {article.title}
                         </a>
                        
                        {/* Article Description */}
                        {article.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {article.description}
                          </p>
                        )}
                        
                        {/* Meta Information */}
                        <div className="flex items-center gap-3 text-xs text-foreground">
                          <span className="font-bold">
                            {typeof article.source === 'string' ? article.source : article.source?.name || 'Unknown Source'}
                          </span>
                          <span>•</span>
                          <span className="font-bold">{formatDate(article.publishedAt)}</span>
                          <span>•</span>
                          <span className="font-bold">{formatTime(article.publishedAt)}</span>
                          <span>•</span>
                          <span className="font-bold">{getTimeAgo(article.publishedAt)}</span>
                          {article.paywalled && (
                            <>
                              <span>•</span>
                              <Badge variant="secondary" className="text-xs flex items-center gap-1 h-4 px-1.5">
                                <Lock className="h-2.5 w-2.5" />
                                Premium
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default News;
