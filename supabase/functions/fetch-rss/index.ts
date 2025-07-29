import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

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

    // Fetch and parse RSS feeds
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
        const parser = new DOMParser()
        const doc = parser.parseFromString(xmlText, 'application/xml')

        if (!doc) {
          console.error(`Failed to parse XML from ${source.name}`)
          continue
        }

        const items = doc.querySelectorAll('item')
        console.log(`Found ${items.length} items in ${source.name}`)

        for (const item of items) {
          const title = item.querySelector('title')?.textContent || ''
          const description = item.querySelector('description')?.textContent || ''
          const link = item.querySelector('link')?.textContent || ''
          const pubDate = item.querySelector('pubDate')?.textContent || ''

          if (title && link) {
            allArticles.push({
              title: title.trim(),
              description: description.trim(),
              link: link.trim(),
              pubDate: pubDate.trim(),
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

    // Filter articles based on user preferences if any exist
    let filteredArticles = allArticles
    
    if (teams.length > 0 || sports.length > 0 || players.length > 0) {
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
        
        // Check if category matches user's sports
        const categoryMatch = sports.some(sport => {
          const sportName = sport.sport_name.toLowerCase()
          const category = article.category.toLowerCase()
          return (
            (sportName === 'baseball' && category.includes('baseball')) ||
            (sportName === 'football' && category.includes('football')) ||
            (sportName === 'basketball' && category.includes('basketball')) ||
            (sportName === 'hockey' && category.includes('hockey'))
          )
        })

        return teamMatch || sportMatch || playerMatch || categoryMatch
      })
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