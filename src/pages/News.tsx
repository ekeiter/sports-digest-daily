import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, ExternalLink, Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
  author: string;
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
      // Fetch from both sources with individual error handling
      const [newsApiResponse, rssResponse] = await Promise.allSettled([
        supabase.functions.invoke('fetch-news'),
        supabase.functions.invoke('fetch-rss')
      ]);

      console.log('NewsAPI response:', newsApiResponse);
      console.log('RSS response:', rssResponse);

      // Handle NewsAPI results
      const newsApiArticles = newsApiResponse.status === 'fulfilled' 
        ? newsApiResponse.value.data?.articles || []
        : [];
      
      // Handle RSS results (don't fail if RSS is down)
      const rssArticles = rssResponse.status === 'fulfilled' 
        ? rssResponse.value.data?.articles || []
        : [];
      
      console.log('NewsAPI articles:', newsApiArticles.length);
      console.log('RSS articles:', rssArticles.length);
      
      // Merge and deduplicate articles by URL and title
      const allArticles = [...newsApiArticles, ...rssArticles];
      const uniqueArticles = allArticles.filter((article, index, self) => 
        index === self.findIndex(a => a.url === article.url || a.title === article.title)
      );
      
      // Sort by publication date (newest first)
      uniqueArticles.sort((a, b) => {
        const dateA = new Date(a.publishedAt).getTime();
        const dateB = new Date(b.publishedAt).getTime();
        return dateB - dateA;
      });

      console.log('Total unique articles:', uniqueArticles.length);
      setArticles(uniqueArticles);
      setTotalResults(uniqueArticles.length);
      setLoadedPersonalized(true);

      if (uniqueArticles.length === 0) {
        toast({
          title: "No articles found",
          description: "Try adding more teams, sports, or players to your preferences",
        });
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      toast({
        title: "Error",
        description: "Failed to fetch personalized news",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNews = async (query: string) => {
    setLoading(true);
    setLoadedPersonalized(false);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-news', {
        body: {
          query: query,
          pageSize: 20,
          language: 'en'
        }
      });

      if (error) {
        console.error('Error fetching news:', error);
        toast({
          title: "Error",
          description: "Failed to fetch news",
          variant: "destructive",
        });
        return;
      }

      const newsData = data as NewsResponse;
      if (newsData.status === 'ok') {
        setArticles(newsData.articles || []);
        setTotalResults(newsData.totalResults || 0);
      } else {
        throw new Error('Invalid response from news API');
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      toast({
        title: "Error",
        description: "Failed to fetch news",
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
                        {article.source.name}
                      </Badge>
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
                        Read
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