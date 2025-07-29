import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NewsArticle {
  title: string;
  description?: string;
  url: string;
  source: string;
  publishedAt: string;
  paywalled?: boolean;
  sourceType: "newsapi" | "gnews" | "rss";
}

const paywalledDomains = [
  "theathletic.com", "nytimes.com", "wsj.com", "bloomberg.com"
];

const rssFeeds: Record<string, string[]> = {
  "Philadelphia Phillies": [
    "https://philliesnation.com/feed/", // Working Phillies-specific RSS feed
    "https://feeds.espn.com/rss/mlb/news" // ESPN MLB general news
  ],
  "New York Yankees": [
    "https://www.nydailynews.com/sports/baseball/yankees/rss2.0.xml"
  ]
};

function deduplicate(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set();
  return articles.filter(a => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });
}

async function fetchFromNewsAPI(query: string): Promise<NewsArticle[]> {
  try {
    const NEWSAPI_KEY = Deno.env.get('NEWSAPI_KEY');
    if (!NEWSAPI_KEY) return [];

    const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const response = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${from}&language=en&sortBy=publishedAt&apiKey=${NEWSAPI_KEY}&pageSize=20`);
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return (data.articles || []).map((a: any) => ({
      title: a.title,
      description: a.description,
      url: a.url,
      source: a.source?.name || "",
      publishedAt: a.publishedAt,
      sourceType: "newsapi" as const
    }));
  } catch (error) {
    console.error('NewsAPI error:', error);
    return [];
  }
}

async function fetchFromGNews(query: string): Promise<NewsArticle[]> {
  try {
    const GNEWS_KEY = Deno.env.get('GNEWS_KEY');
    if (!GNEWS_KEY) return [];

    const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const response = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&from=${from}&lang=en&token=${GNEWS_KEY}&max=20`);
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return (data.articles || []).map((a: any) => ({
      title: a.title,
      description: a.description,
      url: a.url,
      source: a.source?.name || "",
      publishedAt: a.publishedAt || a.published_at,
      sourceType: "gnews" as const
    }));
  } catch (error) {
    console.error('GNews error:', error);
    return [];
  }
}

async function fetchFromRSS(topics: string[]): Promise<NewsArticle[]> {
  try {
    const topicFeeds = topics.flatMap(t => (rssFeeds[t] || []));
    const uniqueFeeds = [...new Set(topicFeeds)];
    
    console.log('RSS feeds to fetch:', uniqueFeeds);
    
    const rssResults = await Promise.allSettled(
      uniqueFeeds.map(async (feed) => {
        try {
          console.log(`Fetching RSS feed: ${feed}`);
          const response = await fetch(feed);
          if (!response.ok) {
            console.error(`RSS feed ${feed} returned status: ${response.status}`);
            return [];
          }
          
          const xmlText = await response.text();
          console.log(`RSS feed ${feed} fetched, length: ${xmlText.length}`);
          
          // Simple RSS parsing for title, link, and pubDate
          const items = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
          console.log(`Found ${items.length} items in ${feed}`);
          
          const articles = items.map(item => {
            // Enhanced regex patterns for better parsing
            const titleMatch = item.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
            const linkMatch = item.match(/<link[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/i);
            const pubDateMatch = item.match(/<pubDate[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/pubDate>/i);
            const descMatch = item.match(/<description[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/i);
            
            const title = titleMatch?.[1]?.trim() || "";
            const link = linkMatch?.[1]?.trim() || "";
            const pubDate = pubDateMatch?.[1]?.trim() || "";
            const description = descMatch?.[1]?.trim() || "";
            
            return {
              title: title.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'),
              description: description.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'),
              url: link,
              source: "Phillies Nation", // Use a cleaner source name
              publishedAt: pubDate,
              sourceType: "rss" as const
            };
          }).filter(article => article.title && article.url);
          
          console.log(`Parsed ${articles.length} valid articles from ${feed}`);
          return articles;
        } catch (error) {
          console.error(`RSS feed error for ${feed}:`, error);
          return [];
        }
      })
    );
    
    return rssResults
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => result.value);
  } catch (error) {
    console.error('RSS parsing error:', error);
    return [];
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topics = [] } = await req.json();
    
    if (!topics.length) {
      return new Response(
        JSON.stringify({ articles: [], error: 'No topics provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const query = topics.map((t: string) => `"${t}"`).join(" OR ");

    console.log('Fetching unified news for topics:', topics);

    // Fetch from all sources in parallel
    const [newsApiArticles, gnewsArticles, rssArticles] = await Promise.all([
      fetchFromNewsAPI(query),
      fetchFromGNews(query),
      fetchFromRSS(topics)
    ]);

    console.log('Results:', {
      newsApi: newsApiArticles.length,
      gnews: gnewsArticles.length,
      rss: rssArticles.length
    });

    // Combine and deduplicate
    let allArticles: NewsArticle[] = [...newsApiArticles, ...gnewsArticles, ...rssArticles];
    
    // Filter articles based on topics, but be more lenient with RSS feeds since they're already topic-specific
    const filteredArticles = allArticles.filter(article => {
      // RSS articles from topic-specific feeds should be included by default
      if (article.sourceType === 'rss') {
        return true;
      }
      
      // For API sources, filter by topic relevance
      const searchText = `${article.title} ${article.description || ''}`.toLowerCase();
      return topics.some(topic => searchText.includes(topic.toLowerCase()));
    });

    console.log(`Filtered articles: ${filteredArticles.length} out of ${allArticles.length} total (RSS: ${rssArticles.length}, API: ${newsApiArticles.length + gnewsArticles.length})`);
    
    const finalArticles = deduplicate(filteredArticles).map(a => ({
      ...a,
      paywalled: paywalledDomains.some(domain => a.url.includes(domain))
    }));

    // Sort by publication date (newest first)
    finalArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return new Response(
      JSON.stringify({ articles: finalArticles }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Unified news error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});