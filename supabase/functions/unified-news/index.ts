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
    "https://www.inquirer.com/phillies/rss/",
    "https://www.nbcsports.com/philadelphia/rss/feed/46"
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
    
    const rssResults = await Promise.allSettled(
      uniqueFeeds.map(async (feed) => {
        try {
          const response = await fetch(feed);
          if (!response.ok) return [];
          
          const xmlText = await response.text();
          // Simple RSS parsing for title, link, and pubDate
          const items = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
          
          return items.map(item => {
            const title = item.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>|<title[^>]*>(.*?)<\/title>/i)?.[1] || item.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>|<title[^>]*>(.*?)<\/title>/i)?.[2] || "";
            const link = item.match(/<link[^>]*>(.*?)<\/link>/i)?.[1] || "";
            const pubDate = item.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i)?.[1] || "";
            const description = item.match(/<description[^>]*><!\[CDATA\[(.*?)\]\]><\/description>|<description[^>]*>(.*?)<\/description>/i)?.[1] || item.match(/<description[^>]*><!\[CDATA\[(.*?)\]\]><\/description>|<description[^>]*>(.*?)<\/description>/i)?.[2] || "";
            
            return {
              title: title.trim(),
              description: description.trim(),
              url: link.trim(),
              source: feed.split('/')[2] || "",
              publishedAt: pubDate.trim(),
              sourceType: "rss" as const
            };
          }).filter(article => article.title && article.url);
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
    const { topics = ["Philadelphia Phillies", "New York Yankees", "MLB", "Baseball"] } = await req.json();
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
    
    allArticles = deduplicate(allArticles).map(a => ({
      ...a,
      paywalled: paywalledDomains.some(domain => a.url.includes(domain))
    }));

    // Sort by publication date (newest first)
    allArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return new Response(
      JSON.stringify({ articles: allArticles }),
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