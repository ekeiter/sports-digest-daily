import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CachedArticle {
  id: number;
  title: string;
  description: string | null;
  url: string;
  image_url: string | null;
  source: string;
  published_at: string;
  cached_at: string;
  last_fetched: string;
}

const paywalledDomains = [
  "theathletic.com", "nytimes.com", "wsj.com", "bloomberg.com"
];

async function getNewsTimeRange(supabase: any): Promise<number> {
  try {
    const { data: newsConfig } = await supabase
      .from('news_config')
      .select('hours_back')
      .maybeSingle();
    
    return newsConfig?.hours_back || 24; // Default to 24 hours
  } catch (error) {
    console.error('Error getting news time range:', error);
    return 24; // Default to 24 hours on error
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topics = [], searchQuery = '', hoursBack } = await req.json();
    
    console.log('📖 Getting cached articles for topics:', topics, 'search:', searchQuery);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Use provided hoursBack or get from user preferences
    const timeRange = hoursBack || await getNewsTimeRange(supabase);
    const cutoffTime = new Date(Date.now() - timeRange * 60 * 60 * 1000);
    
    console.log('⏰ Using time range:', timeRange, 'hours, cutoff:', cutoffTime.toISOString());

    let query = supabase
      .from('cached_articles')
      .select('*')
      .gte('published_at', cutoffTime.toISOString())
      .order('published_at', { ascending: false });

    // If we have a search query, filter by it
    if (searchQuery.trim()) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }
    // If we have topics but no search query, filter by topics
    else if (topics.length > 0) {
      const topicFilters = topics.map((topic: string) => {
        const words = topic.toLowerCase().split(' ');
        return words.map(word => 
          `title.ilike.%${word}%,description.ilike.%${word}%,url.ilike.%${word}%`
        ).join(',');
      }).join(',');
      
      query = query.or(topicFilters);
    }

    const { data: articles, error } = await query;

    if (error) {
      console.error('❌ Error fetching cached articles:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch articles' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('📊 Found', articles?.length || 0, 'cached articles');

    // Transform to match the frontend's expected format
    const transformedArticles = (articles || []).map((article: CachedArticle) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      urlToImage: article.image_url,
      source: article.source,
      publishedAt: article.published_at,
      paywalled: paywalledDomains.some(domain => article.url.includes(domain)),
      sourceType: "cached" as const,
      cachedAt: article.cached_at,
      lastFetched: article.last_fetched
    }));

    return new Response(
      JSON.stringify({ 
        articles: transformedArticles,
        totalResults: transformedArticles.length,
        fromCache: true,
        timeRange: `${hoursBack} hours`
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('❌ Get cached articles error:', error);
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