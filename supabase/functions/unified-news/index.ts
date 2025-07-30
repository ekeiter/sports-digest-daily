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

// RSS feeds are now managed in the database

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

// Team to sport and city mapping
const TEAM_MAPPINGS: Record<string, { sport: string; city: string }> = {
  // MLB Teams
  'yankees': { sport: 'MLB', city: 'New York' },
  'red sox': { sport: 'MLB', city: 'Boston' },
  'blue jays': { sport: 'MLB', city: 'Toronto' },
  'rays': { sport: 'MLB', city: 'Tampa Bay' },
  'orioles': { sport: 'MLB', city: 'Baltimore' },
  'white sox': { sport: 'MLB', city: 'Chicago' },
  'guardians': { sport: 'MLB', city: 'Cleveland' },
  'tigers': { sport: 'MLB', city: 'Detroit' },
  'royals': { sport: 'MLB', city: 'Kansas City' },
  'twins': { sport: 'MLB', city: 'Minneapolis' },
  'astros': { sport: 'MLB', city: 'Houston' },
  'angels': { sport: 'MLB', city: 'Los Angeles' },
  'athletics': { sport: 'MLB', city: 'Oakland' },
  'mariners': { sport: 'MLB', city: 'Seattle' },
  'rangers': { sport: 'MLB', city: 'Texas' },
  'braves': { sport: 'MLB', city: 'Atlanta' },
  'marlins': { sport: 'MLB', city: 'Miami' },
  'mets': { sport: 'MLB', city: 'New York' },
  'phillies': { sport: 'MLB', city: 'Philadelphia' },
  'nationals': { sport: 'MLB', city: 'Washington' },
  'cubs': { sport: 'MLB', city: 'Chicago' },
  'reds': { sport: 'MLB', city: 'Cincinnati' },
  'brewers': { sport: 'MLB', city: 'Milwaukee' },
  'pirates': { sport: 'MLB', city: 'Pittsburgh' },
  'cardinals': { sport: 'MLB', city: 'St. Louis' },
  'diamondbacks': { sport: 'MLB', city: 'Arizona' },
  'rockies': { sport: 'MLB', city: 'Colorado' },
  'dodgers': { sport: 'MLB', city: 'Los Angeles' },
  'padres': { sport: 'MLB', city: 'San Diego' },
  'giants': { sport: 'MLB', city: 'San Francisco' },
  
  // NFL Teams  
  'bills': { sport: 'NFL', city: 'Buffalo' },
  'dolphins': { sport: 'NFL', city: 'Miami' },
  'patriots': { sport: 'NFL', city: 'New England' },
  'jets': { sport: 'NFL', city: 'New York' },
  'ravens': { sport: 'NFL', city: 'Baltimore' },
  'bengals': { sport: 'NFL', city: 'Cincinnati' },
  'browns': { sport: 'NFL', city: 'Cleveland' },
  'steelers': { sport: 'NFL', city: 'Pittsburgh' },
  'texans': { sport: 'NFL', city: 'Houston' },
  'colts': { sport: 'NFL', city: 'Indianapolis' },
  'jaguars': { sport: 'NFL', city: 'Jacksonville' },
  'titans': { sport: 'NFL', city: 'Tennessee' },
  'broncos': { sport: 'NFL', city: 'Denver' },
  'chiefs': { sport: 'NFL', city: 'Kansas City' },
  'raiders': { sport: 'NFL', city: 'Las Vegas' },
  'chargers': { sport: 'NFL', city: 'Los Angeles' },
  'cowboys': { sport: 'NFL', city: 'Dallas' },
  'eagles': { sport: 'NFL', city: 'Philadelphia' },
  'commanders': { sport: 'NFL', city: 'Washington' },
  'bears': { sport: 'NFL', city: 'Chicago' },
  'lions': { sport: 'NFL', city: 'Detroit' },
  'packers': { sport: 'NFL', city: 'Green Bay' },
  'vikings': { sport: 'NFL', city: 'Minnesota' },
  'falcons': { sport: 'NFL', city: 'Atlanta' },
  'panthers': { sport: 'NFL', city: 'Carolina' },
  'saints': { sport: 'NFL', city: 'New Orleans' },
  'buccaneers': { sport: 'NFL', city: 'Tampa Bay' },
  'cardinals': { sport: 'NFL', city: 'Arizona' },
  'rams': { sport: 'NFL', city: 'Los Angeles' },
  'seahawks': { sport: 'NFL', city: 'Seattle' },
  '49ers': { sport: 'NFL', city: 'San Francisco' },
  
  // NBA Teams
  'celtics': { sport: 'NBA', city: 'Boston' },
  'nets': { sport: 'NBA', city: 'Brooklyn' },
  'knicks': { sport: 'NBA', city: 'New York' },
  '76ers': { sport: 'NBA', city: 'Philadelphia' },
  'raptors': { sport: 'NBA', city: 'Toronto' },
  'bulls': { sport: 'NBA', city: 'Chicago' },
  'cavaliers': { sport: 'NBA', city: 'Cleveland' },
  'pistons': { sport: 'NBA', city: 'Detroit' },
  'pacers': { sport: 'NBA', city: 'Indiana' },
  'bucks': { sport: 'NBA', city: 'Milwaukee' },
  'hawks': { sport: 'NBA', city: 'Atlanta' },
  'hornets': { sport: 'NBA', city: 'Charlotte' },
  'heat': { sport: 'NBA', city: 'Miami' },
  'magic': { sport: 'NBA', city: 'Orlando' },
  'wizards': { sport: 'NBA', city: 'Washington' },
  'nuggets': { sport: 'NBA', city: 'Denver' },
  'timberwolves': { sport: 'NBA', city: 'Minnesota' },
  'thunder': { sport: 'NBA', city: 'Oklahoma City' },
  'blazers': { sport: 'NBA', city: 'Portland' },
  'jazz': { sport: 'NBA', city: 'Utah' },
  'warriors': { sport: 'NBA', city: 'Golden State' },
  'clippers': { sport: 'NBA', city: 'Los Angeles' },
  'lakers': { sport: 'NBA', city: 'Los Angeles' },
  'suns': { sport: 'NBA', city: 'Phoenix' },
  'kings': { sport: 'NBA', city: 'Sacramento' },
  'mavericks': { sport: 'NBA', city: 'Dallas' },
  'rockets': { sport: 'NBA', city: 'Houston' },
  'grizzlies': { sport: 'NBA', city: 'Memphis' },
  'pelicans': { sport: 'NBA', city: 'New Orleans' },
  'spurs': { sport: 'NBA', city: 'San Antonio' },
  
  // NHL Teams
  'bruins': { sport: 'NHL', city: 'Boston' },
  'sabres': { sport: 'NHL', city: 'Buffalo' },
  'red wings': { sport: 'NHL', city: 'Detroit' },
  'panthers': { sport: 'NHL', city: 'Florida' },
  'canadiens': { sport: 'NHL', city: 'Montreal' },
  'senators': { sport: 'NHL', city: 'Ottawa' },
  'lightning': { sport: 'NHL', city: 'Tampa Bay' },
  'maple leafs': { sport: 'NHL', city: 'Toronto' },
  'hurricanes': { sport: 'NHL', city: 'Carolina' },
  'blue jackets': { sport: 'NHL', city: 'Columbus' },
  'devils': { sport: 'NHL', city: 'New Jersey' },
  'islanders': { sport: 'NHL', city: 'New York' },
  'rangers': { sport: 'NHL', city: 'New York' },
  'flyers': { sport: 'NHL', city: 'Philadelphia' },
  'penguins': { sport: 'NHL', city: 'Pittsburgh' },
  'capitals': { sport: 'NHL', city: 'Washington' },
  'blackhawks': { sport: 'NHL', city: 'Chicago' },
  'avalanche': { sport: 'NHL', city: 'Colorado' },
  'stars': { sport: 'NHL', city: 'Dallas' },
  'wild': { sport: 'NHL', city: 'Minnesota' },
  'predators': { sport: 'NHL', city: 'Nashville' },
  'blues': { sport: 'NHL', city: 'St. Louis' },
  'flames': { sport: 'NHL', city: 'Calgary' },
  'oilers': { sport: 'NHL', city: 'Edmonton' },
  'kraken': { sport: 'NHL', city: 'Seattle' },
  'canucks': { sport: 'NHL', city: 'Vancouver' },
  'ducks': { sport: 'NHL', city: 'Anaheim' },
  'coyotes': { sport: 'NHL', city: 'Arizona' },
  'sharks': { sport: 'NHL', city: 'San Jose' },
  'kings': { sport: 'NHL', city: 'Los Angeles' },
  'golden knights': { sport: 'NHL', city: 'Vegas' }
};

async function fetchFromRSS(topics: string[], supabase: any): Promise<NewsArticle[]> {
  console.log('🔥🔥🔥 RSS FUNCTION STARTED WITH TOPICS:', JSON.stringify(topics));
  
  try {
    // Get RSS feeds from database that match the topics
    const { data: rssFeeds, error } = await supabase
      .from('rss_sources')
      .select('*')
      .eq('is_active', true);

    console.log('📊 RSS FEEDS COUNT:', rssFeeds?.length || 0);
    console.log('❌ RSS ERROR:', error);

    if (error || !rssFeeds) {
      console.log('💥 EARLY RETURN DUE TO ERROR OR NO FEEDS');
      return [];
    }


    // Extract sports and cities from topics using team mappings
    const sportCityFilters = new Set<string>();
    
    topics.forEach(topic => {
      const topicLower = topic.toLowerCase();
      console.log('=== Processing topic:', topic);
      
      // Special handling for Phillies - this should always work
      if (topicLower.includes('phillies') || topicLower.includes('philadelphia phillies')) {
        console.log('✓ Phillies detected! Adding MLB|Philadelphia filter');
        sportCityFilters.add('MLB|Philadelphia');
      }
      
      // Check if topic matches a team name directly
      const teamMapping = TEAM_MAPPINGS[topicLower];
      if (teamMapping) {
        console.log('✓ Direct match found for', topicLower, ':', teamMapping);
        sportCityFilters.add(`${teamMapping.sport}|${teamMapping.city}`);
      }
      
      // Check for partial matches (team name within topic)
      for (const [teamName, mapping] of Object.entries(TEAM_MAPPINGS)) {
        if (topicLower.includes(teamName)) {
          console.log('✓ Partial match: topic contains', teamName, '→', mapping);
          sportCityFilters.add(`${mapping.sport}|${mapping.city}`);
        }
      }
    });

    console.log('🎯 Final Sport/City filters:', Array.from(sportCityFilters));

    // TEMPORARY: Force include the Phila Inquirer feed for debugging
    console.log('🚨 TEMPORARILY FORCING PHILA INQUIRER FEED TO BE INCLUDED');
    const relevantFeeds = rssFeeds.filter(feed => {
      console.log('📝 Checking feed:', feed.name, 'sport:', feed.sport, 'city:', feed.city);
      
      // Temporarily force include the Phila Inquirer
      if (feed.name === 'Phila Inquirer') {
        console.log('🔥 FORCING PHILA INQUIRER TO BE INCLUDED');
        return true;
      }
      
      // If no team mappings found, fall back to general matching
      if (sportCityFilters.size === 0) {
        console.log('🔄 No sport/city filters, using general matching');
        return topics.some(topic => {
          const topicLower = topic.toLowerCase();
          const nameLower = feed.name.toLowerCase();
          const sportLower = feed.sport.toLowerCase();
          const cityLower = feed.city.toLowerCase();
          
          return nameLower.includes(topicLower) || 
                 sportLower.includes(topicLower) ||
                 cityLower.includes(topicLower) ||
                 sportLower === 'general' ||
                 cityLower === 'general' ||
                 topicLower.includes(nameLower);
        });
      }
      
      // Use sport/city filtering for team-based searches
      const matchResult = Array.from(sportCityFilters).some(filter => {
        const [targetSport, targetCity] = filter.split('|');
        const feedSport = feed.sport.toLowerCase();
        const feedCity = feed.city.toLowerCase();
        
        const sportMatch = feedSport === targetSport.toLowerCase() || feedSport === 'all';
        const cityMatch = feedCity === targetCity.toLowerCase() || feedCity === 'all';
        
        console.log(`Filter ${filter}: sport match (${feedSport} === ${targetSport.toLowerCase()} or 'all'): ${sportMatch}, city match (${feedCity} === ${targetCity.toLowerCase()} or 'all'): ${cityMatch}`);
        
        return sportMatch && cityMatch;
      });
      
      console.log('Feed matches:', matchResult);
      return matchResult;
    });
    
    console.log('📋 Relevant feeds selected:', relevantFeeds.length);
    console.log('📝 Feed details:', relevantFeeds.map(f => ({ name: f.name, url: f.url })));
    
    if (relevantFeeds.length === 0) {
      console.log('⚠️ NO RELEVANT FEEDS FOUND - returning empty array');
      return [];
    }
    
    const rssResults = await Promise.allSettled(
      relevantFeeds.map(async (feedData) => {
        try {
          console.log(`🌐 Fetching RSS feed: ${feedData.url} (${feedData.name})`);
          const response = await fetch(feedData.url);
          
          console.log(`📡 Response status for ${feedData.url}: ${response.status}`);
          
          if (!response.ok) {
            console.error(`❌ RSS feed ${feedData.url} returned status: ${response.status}`);
            return [];
          }
          
          const xmlText = await response.text();
          console.log(`RSS feed ${feedData.url} fetched, length: ${xmlText.length}`);
          
          // Simple RSS parsing for title, link, and pubDate
          const items = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
          console.log(`Found ${items.length} items in ${feedData.url}`);
          
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
            
            // Decode HTML entities
            const decodeHtmlEntities = (text: string) => {
              return text
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/&apos;/g, "'")
                .replace(/&#x27;/g, "'")
                .replace(/&#x2F;/g, '/')
                .replace(/&#x2019;/g, "'")
                .replace(/&#8217;/g, "'")
                .replace(/&#8216;/g, "'")
                .replace(/&#8220;/g, '"')
                .replace(/&#8221;/g, '"');
            };
            
            return {
              title: decodeHtmlEntities(title),
              description: decodeHtmlEntities(description),
              url: link,
              source: feedData.name,
              publishedAt: pubDate,
              sourceType: "rss" as const
            };
          }).filter(article => article.title && article.url);
          
          console.log(`Parsed ${articles.length} valid articles from ${feedData.url}`);
          return articles;
        } catch (error) {
          console.error(`RSS feed error for ${feedData.url}:`, error);
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

    console.log('Results:', {
      newsApi: newsApiArticles.length,
      gnews: gnewsArticles.length,
      rss: rssArticles.length
    });

    // Combine and deduplicate
    let allArticles: NewsArticle[] = [...newsApiArticles, ...gnewsArticles, ...rssArticles];
    
    // Filter articles based on topics - all articles must specifically mention the topics
    const filteredArticles = allArticles.filter(article => {
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