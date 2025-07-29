import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Auth error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Fetching RSS feeds for user:', user.id)

    // Get active RSS sources
    const { data: rssSources, error: rssError } = await supabase
      .from('rss_sources')
      .select('*')
      .eq('is_active', true)

    if (rssError) {
      console.error('Error fetching RSS sources:', rssError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch RSS sources' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${rssSources?.length || 0} RSS sources`)

    // Get user preferences for filtering
    const [teamsResponse, sportsResponse, playersResponse] = await Promise.all([
      supabase.from('user_teams').select('team_name, league').eq('user_id', user.id),
      supabase.from('user_sports').select('sport_name').eq('user_id', user.id),
      supabase.from('user_players').select('player_name, sport').eq('user_id', user.id)
    ])

    const teams = teamsResponse.data || []
    const sports = sportsResponse.data || []
    const players = playersResponse.data || []

    // Fetch and parse RSS feeds using simple regex parsing
    const allArticles: RSSItem[] = []
    
    for (const source of rssSources || []) {
      try {
        console.log(`Fetching RSS from: ${source.name}`)
        
        const response = await fetch(source.url, {
          headers: {
            'User-Agent': 'Sports-Digest-RSS-Reader/1.0'
          }
        })

        if (!response.ok) {
          console.error(`Failed to fetch ${source.name}: ${response.status}`)
          continue
        }

        const xmlText = await response.text()
        console.log(`Received ${xmlText.length} characters from ${source.name}`)
        console.log(`First 500 chars: ${xmlText.substring(0, 500)}`)

        // Parse RSS items using regex (more reliable than DOM parser in Deno)
        // Make the regex case-insensitive and handle various RSS formats
        const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || []
        console.log(`Found ${itemMatches.length} RSS items in ${source.name}`)
        
        for (const itemXml of itemMatches) {
          // Extract title - handle multiple CDATA formats
          let title = ''
          const titleMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/gi)
          if (titleMatch && titleMatch[0]) {
            const titleContent = titleMatch[0]
            // Remove CDATA wrapper and HTML tags
            title = titleContent
              .replace(/<title[^>]*>/gi, '')
              .replace(/<\/title>/gi, '')
              .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
              .replace(/<!--\[CDATA\[(.*?)\]-->/g, '$1')
              .replace(/&lt;!\[CDATA\[(.*?)\]\]&gt;/g, '$1')
              .replace(/<[^>]*>/g, '')
              .trim()
          }

          // Extract description
          let description = ''
          const descMatch = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/gi)
          if (descMatch && descMatch[0]) {
            const descContent = descMatch[0]
            description = descContent
              .replace(/<description[^>]*>/gi, '')
              .replace(/<\/description>/gi, '')
              .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
              .replace(/<!--\[CDATA\[(.*?)\]-->/g, '$1')
              .replace(/&lt;!\[CDATA\[(.*?)\]\]&gt;/g, '$1')
              .replace(/<[^>]*>/g, '')
              .trim()
          }

          // Extract link
          let link = ''
          const linkMatch = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/gi)
          if (linkMatch && linkMatch[0]) {
            const linkContent = linkMatch[0]
            link = linkContent
              .replace(/<link[^>]*>/gi, '')
              .replace(/<\/link>/gi, '')
              .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
              .replace(/<!--\[CDATA\[(.*?)\]-->/g, '$1')
              .replace(/&lt;!\[CDATA\[(.*?)\]\]&gt;/g, '$1')
              .trim()
          }

          // Extract pubDate (try multiple variations)
          let pubDate = ''
          const pubDateMatch = itemXml.match(/<pubdate[^>]*>([\s\S]*?)<\/pubdate>/gi) ||
                               itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/gi) ||
                               itemXml.match(/<published[^>]*>([\s\S]*?)<\/published>/gi)
          if (pubDateMatch && pubDateMatch[0]) {
            pubDate = pubDateMatch[0]
              .replace(/<[^>]*>/g, '')
              .trim()
          }

          console.log(`Parsed: "${title.substring(0, 30)}..." link: "${link.substring(0, 50)}..."`)

          if (title && link && link.startsWith('http')) {
            allArticles.push({
              title: title,
              description: description,
              link: link,
              pubDate: pubDate || new Date().toISOString(),
              source: source.name,
              category: source.category
            })
          }
        }
      } catch (error) {
        console.error(`Error processing RSS source ${source.name}:`, error)
        continue
      }
    }

    console.log(`Total articles collected: ${allArticles.length}`)

    // Filter articles based on user preferences, but be more lenient
    let filteredArticles = allArticles
    
    if (teams.length > 0 || sports.length > 0 || players.length > 0) {
      console.log(`Filtering ${allArticles.length} articles with preferences:`, {
        teams: teams.map(t => t.team_name),
        sports: sports.map(s => s.sport_name), 
        players: players.map(p => p.player_name)
      })
      
      filteredArticles = allArticles.filter(article => {
        const content = `${article.title} ${article.description}`.toLowerCase()
        
        // Check for team mentions
        const teamMatch = teams.some(team => 
          content.includes(team.team_name.toLowerCase())
        )
        
        // Check for sport mentions  
        const sportMatch = sports.some(sport => 
          content.includes(sport.sport_name.toLowerCase())
        )
        
        // Check for player mentions
        const playerMatch = players.some(player => 
          content.includes(player.player_name.toLowerCase())
        )
        
        // Check if category matches user's sports (more flexible matching)
        const categoryMatch = sports.some(sport => {
          const sportName = sport.sport_name.toLowerCase()
          const category = article.category.toLowerCase()
          return (
            (sportName === 'baseball' && (category.includes('baseball') || category.includes('mlb'))) ||
            (sportName === 'football' && (category.includes('football') || category.includes('nfl'))) ||
            (sportName === 'basketball' && (category.includes('basketball') || category.includes('nba'))) ||
            (sportName === 'hockey' && (category.includes('hockey') || category.includes('nhl')))
          )
        })

        // Also include general sports articles if user has any sports preferences
        const generalSportsMatch = sports.length > 0 && (
          article.category.toLowerCase().includes('top') ||
          article.category.toLowerCase().includes('headlines') ||
          content.includes('mlb') ||
          content.includes('nfl') ||
          content.includes('nba') ||
          content.includes('nhl')
        )

        const matches = teamMatch || sportMatch || playerMatch || categoryMatch || generalSportsMatch
        if (matches) {
          console.log(`Article matched: "${article.title.substring(0, 50)}..." - Category: ${article.category}`)
        }
        return matches
      })
      
      console.log(`After filtering: ${filteredArticles.length} articles remaining`)
    } else {
      console.log('No user preferences found, returning all articles')
    }

    // Sort by publication date (newest first)
    filteredArticles.sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime()
      const dateB = new Date(b.pubDate).getTime()
      return dateB - dateA
    })

    // Limit to most recent 50 articles
    const limitedArticles = filteredArticles.slice(0, 50)

    console.log(`Returning ${limitedArticles.length} filtered articles`)

    return new Response(
      JSON.stringify({
        status: 'ok',
        totalResults: limitedArticles.length,
        articles: limitedArticles.map(article => ({
          source: { name: article.source },
          title: article.title,
          description: article.description,
          url: article.link,
          publishedAt: article.pubDate,
          category: article.category
        }))
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in fetch-rss function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})