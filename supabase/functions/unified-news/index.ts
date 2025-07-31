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

async function fetchFromNewsAPI(query: string, hoursBack: number): Promise<NewsArticle[]> {
  try {
    const NEWSAPI_KEY = Deno.env.get('NEWSAPI_KEY');
    if (!NEWSAPI_KEY) return [];

    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    const fromDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    const from = fromDate.toISOString().split('T')[0];
    
    console.log('📰 NewsAPI: Hours back:', hoursBack, 'Cutoff time:', cutoffTime.toISOString());
    
    const response = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${from}&language=en&sortBy=publishedAt&apiKey=${NEWSAPI_KEY}&pageSize=100`);
    
    if (!response.ok) return [];
    
    const data = await response.json();
    console.log('📰 NewsAPI returned', (data.articles || []).length, 'articles before time filtering');
    
    // Filter articles to ensure they're within the exact hour cutoff
    const filteredArticles = (data.articles || []).filter((a: any) => {
      if (!a.publishedAt) return false;
      const articleDate = new Date(a.publishedAt);
      const isWithinRange = articleDate >= cutoffTime;
      console.log('📰 NewsAPI article:', a.title.substring(0, 50), 'Date:', a.publishedAt, 'Within range:', isWithinRange);
      return isWithinRange;
    });
    
    console.log('📰 NewsAPI: After time filtering', filteredArticles.length, 'articles remain');
    
    return filteredArticles.map((a: any) => ({
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

async function fetchFromGNews(query: string, hoursBack: number): Promise<NewsArticle[]> {
  try {
    const GNEWS_KEY = Deno.env.get('GNEWS_KEY');
    if (!GNEWS_KEY) return [];

    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    const fromDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    const from = fromDate.toISOString().split('T')[0];
    
    console.log('📰 GNews: Hours back:', hoursBack, 'Cutoff time:', cutoffTime.toISOString());
    
    const response = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&from=${from}&lang=en&token=${GNEWS_KEY}&max=100`);
    
    if (!response.ok) return [];
    
    const data = await response.json();
    console.log('📰 GNews returned', (data.articles || []).length, 'articles before time filtering');
    
    // Filter articles to ensure they're within the exact hour cutoff
    const filteredArticles = (data.articles || []).filter((a: any) => {
      if (!a.publishedAt && !a.published_at) return false;
      const publishDate = a.publishedAt || a.published_at;
      const articleDate = new Date(publishDate);
      const isWithinRange = articleDate >= cutoffTime;
      console.log('📰 GNews article:', a.title.substring(0, 50), 'Date:', publishDate, 'Within range:', isWithinRange);
      return isWithinRange;
    });
    
    console.log('📰 GNews: After time filtering', filteredArticles.length, 'articles remain');
    
    return filteredArticles.map((a: any) => ({
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

async function fetchFromRSS(topics: string[], supabase: any, hoursBack: number): Promise<NewsArticle[]> {
  console.log('🔥 RSS FUNCTION CALLED WITH TOPICS:', topics, 'TIME RANGE:', hoursBack, 'hours');
  
  const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  const now = new Date();
  console.log('⏰ Current time:', now.toISOString(), 'Local:', now.toString());
  console.log('⏰ RSS Cutoff time (', hoursBack, 'hours ago):', cutoffTime.toISOString(), 'Local:', cutoffTime.toString());
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

    // Process all active RSS feeds
    const allRssArticles = [];
    
    for (const feed of rssFeeds) {
      console.log('📡 Fetching RSS from:', feed.name, '-', feed.url);
      
      try {
        const response = await fetch(feed.url);
        if (!response.ok) {
          console.log('❌ RSS fetch failed for', feed.name, 'with status:', response.status);
          continue;
        }

        const xmlText = await response.text();
        console.log('✅ RSS fetched for', feed.name, 'length:', xmlText.length);

        // Simple RSS parsing for items
        const items = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
        console.log('📰 Found', items.length, 'RSS items for', feed.name);
        
        // Log first few items to see what we're getting
        console.log('📋 Sample RSS items from', feed.name, ':');
        items.slice(0, 3).forEach((item, index) => {
          const titleMatch = item.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
          const title = titleMatch?.[1]?.trim().replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'") || "";
          console.log(`  ${index + 1}. ${title}`);
        });

        // Parse articles from this feed - processing all items
        const feedArticles = items.map(item => {
          const titleMatch = item.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
          const linkMatch = item.match(/<link[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/i);
          const pubDateMatch = item.match(/<pubDate[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/pubDate>/i);
          const descMatch = item.match(/<description[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/i);

          const title = titleMatch?.[1]?.trim().replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'") || "";
          const description = descMatch?.[1]?.trim().replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'") || "";
          const url = linkMatch?.[1]?.trim() || "";
          
          // Parse the pubDate and convert to ISO string to handle timezones properly
          let pubDate = new Date().toISOString();
          if (pubDateMatch?.[1]?.trim()) {
            try {
              let dateString = pubDateMatch[1].trim();
              
              // RSS feeds often use "EST" year-round when they should use "EDT" during daylight saving time
              // Properly detect if we're currently in daylight saving time
              if (dateString.includes(' EST')) {
                const now = new Date();
                // Check if current date is in daylight saving time (March 2nd Sunday to November 1st Sunday)
                const year = now.getFullYear();
                const march = new Date(year, 2, 1); // March 1st
                const november = new Date(year, 10, 1); // November 1st
                
                // Find second Sunday in March (DST starts)
                const dstStart = new Date(year, 2, (14 - march.getDay()) % 7 + 7);
                // Find first Sunday in November (DST ends)  
                const dstEnd = new Date(year, 10, (7 - november.getDay()) % 7);
                
                const isDST = now >= dstStart && now < dstEnd;
                
                if (isDST) {
                  dateString = dateString.replace(' EST', ' EDT');
                }
              }
              
              const parsedDate = new Date(dateString);
              if (!isNaN(parsedDate.getTime())) {
                pubDate = parsedDate.toISOString();
              }
            } catch (dateError) {
              console.log('⚠️ Could not parse date:', pubDateMatch[1], 'using current time');
            }
          }

          return {
            title,
            description,
            url,
            source: feed.name,
            publishedAt: pubDate,
            sourceType: "rss" as const
          };
        }).filter(article => {
          // Filter articles that mention the topics in title, description, OR URL
          const searchText = `${article.title} ${article.description} ${article.url}`.toLowerCase();
          console.log('🔍 RSS article evaluation for', feed.name, ':', article.title);
          console.log('  URL:', article.url);
          console.log('  Looking for topics in title, description, and URL:', topics);
          
          const isTopicRelated = topics.some(topic => {
            const topicWords = topic.toLowerCase().split(' ');
            const matches = topicWords.some(word => searchText.includes(word));
            console.log('  Topic check for "' + topic + '": matches =', matches);
            return matches;
          });
          
          // Check if article is within time range
          let isWithinTimeRange = true;
          if (article.publishedAt) {
            try {
              const articleDate = new Date(article.publishedAt);
              isWithinTimeRange = articleDate >= cutoffTime;
               console.log('📅 RSS Time check for', article.title.substring(0, 40), ':');
               console.log('  Article date:', articleDate.toISOString(), 'Local:', articleDate.toString());
               console.log('  Cutoff time:', cutoffTime.toISOString(), 'Local:', cutoffTime.toString());
               console.log('  Within range?', isWithinTimeRange, 'Hours old:', Math.round((Date.now() - articleDate.getTime()) / (1000 * 60 * 60)));
            } catch (dateError) {
              console.log('⚠️ Invalid date for article:', article.title, article.publishedAt);
            }
          }
          
          if (isTopicRelated && isWithinTimeRange) {
            console.log('✅ Including article from', feed.name, ':', article.title);
          } else if (isTopicRelated && !isWithinTimeRange) {
            console.log('❌ Excluding article (too old) from', feed.name, ':', article.title);
          }
          
          return article.title && article.url && isTopicRelated && isWithinTimeRange;
        });

        allRssArticles.push(...feedArticles);
        console.log('✅ Parsed', feedArticles.length, 'valid RSS articles from', feed.name);

      } catch (fetchError) {
        console.log('❌ RSS fetch error for', feed.name, ':', fetchError);
        continue;
      }
    }

    console.log('✅ Total RSS articles from all feeds:', allRssArticles.length);
    return allRssArticles;

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

    // Get configurable time range
    const hoursBack = await getNewsTimeRange(supabase);
    console.log('⏰ Using time range:', hoursBack, 'hours');

    // Fetch from all sources in parallel
    const [newsApiArticles, gnewsArticles, rssArticles] = await Promise.all([
      fetchFromNewsAPI(query, hoursBack),
      fetchFromGNews(query, hoursBack),
      fetchFromRSS(topics, supabase, hoursBack)
    ]);

    console.log(`📊 Results before filtering: NewsAPI: ${newsApiArticles.length}, GNews: ${gnewsArticles.length}, RSS: ${rssArticles.length}`);
    console.log(`⏰ Time range: ${hoursBack} hours back`);

    // Combine and deduplicate
    let allArticles: NewsArticle[] = [...newsApiArticles, ...gnewsArticles, ...rssArticles];
    
    // Filter articles based on topics - all articles must specifically mention the topics
    const filteredArticles = allArticles.filter(article => {
      // For RSS articles, be more lenient with filtering since we already filtered by feed selection
      if (article.sourceType === "rss") {
        console.log('✅ RSS article passed through filter:', article.title);
        return true;
      }
      
      // For API articles, require topic matching in title, description, OR URL
      const searchText = `${article.title} ${article.description || ''} ${article.url}`.toLowerCase();
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