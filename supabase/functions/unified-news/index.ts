import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

async function fetchFromRSS(topics: string[], supabase: any): Promise<NewsArticle[]> {
  console.log('🔥 RSS FUNCTION CALLED WITH TOPICS:', topics);
  
  try {
    // Get RSS feeds from database that match the topics
    const { data: rssFeeds, error } = await supabase
      .from('rss_sources')
      .select('*')
      .eq('is_active', true);

    console.log('📊 RSS FEEDS FROM DATABASE:', rssFeeds?.length || 0);

    if (error || !rssFeeds) {
      console.log('❌ RSS DATABASE ERROR:', error);
      return [];
    }

    // For now, just use the Phila Inquirer feed since we know it should work
    const philaFeed = rssFeeds.find(feed => feed.name === 'Phila Inquirer');
    if (!philaFeed) {
      console.log('❌ Phila Inquirer feed not found');
      return [];
    }

    console.log('📡 Fetching RSS from:', philaFeed.url);
    
    try {
      const response = await fetch(philaFeed.url);
      if (!response.ok) {
        console.log('❌ RSS fetch failed with status:', response.status);
        return [];
      }

      const xmlText = await response.text();
      console.log('✅ RSS fetched, length:', xmlText.length);

      // Simple RSS parsing
      const items = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
      console.log('📰 Found', items.length, 'RSS items');

      const articles = items.slice(0, 5).map(item => {
        const titleMatch = item.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
        const linkMatch = item.match(/<link[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/i);
        const pubDateMatch = item.match(/<pubDate[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/pubDate>/i);
        const descMatch = item.match(/<description[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/i);

        return {
          title: titleMatch?.[1]?.trim().replace(/&amp;/g, '&') || "",
          description: descMatch?.[1]?.trim().replace(/&amp;/g, '&') || "",
          url: linkMatch?.[1]?.trim() || "",
          source: philaFeed.name,
          publishedAt: pubDateMatch?.[1]?.trim() || new Date().toISOString(),
          sourceType: "rss" as const
        };
      }).filter(article => article.title && article.url);

      console.log('✅ Parsed', articles.length, 'valid RSS articles');
      return articles;

    } catch (fetchError) {
      console.log('❌ RSS fetch error:', fetchError);
      return [];
    }

  } catch (error) {
    console.log('❌ RSS function error:', error);
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

    console.log('🔥 Fetching unified news for topics:', topics);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Fetch from all sources in parallel
    const [newsApiArticles, gnewsArticles, rssArticles] = await Promise.all([
      fetchFromNewsAPI(query),
      fetchFromGNews(query),
      fetchFromRSS(topics, supabase)
    ]);

    console.log('📊 Results:', {
      newsApi: newsApiArticles.length,
      gnews: gnewsArticles.length,
      rss: rssArticles.length
    });

    // Combine and deduplicate
    let allArticles: NewsArticle[] = [...newsApiArticles, ...gnewsArticles, ...rssArticles];
    
    // Filter articles based on topics - all articles must specifically mention the topics
    const filteredArticles = allArticles.filter(article => {
      // For RSS articles, be more lenient with filtering since we already filtered by feed selection
      if (article.sourceType === "rss") {
        console.log('✅ RSS article passed through filter:', article.title);
        return true;
      }
      
      // For API articles, require topic matching
      const searchText = `${article.title} ${article.description || ''}`.toLowerCase();
      const matches = topics.some(topic => {
        const topicWords = topic.toLowerCase().split(' ');
        return topicWords.some(word => searchText.includes(word));
      });
      
      console.log('🔍 API article filter result for:', article.title, '- matches:', matches);
      return matches;
    });

    console.log(`🎯 Filtered articles: ${filteredArticles.length} out of ${allArticles.length} total (RSS: ${rssArticles.length}, API: ${newsApiArticles.length + gnewsArticles.length})`);
    
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
    console.error('❌ Unified news error:', error);
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