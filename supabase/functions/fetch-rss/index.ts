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
        const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || []
        console.log(`Found ${itemMatches.length} items in ${source.name}`)
        
        if (itemMatches.length === 0) {
          // Try alternative patterns for different RSS formats
          const entryMatches = xmlText.match(/<entry[^>]*>[\s\S]*?<\/entry>/gi) || []
          console.log(`Found ${entryMatches.length} entries (Atom format) in ${source.name}`)
          
          if (entryMatches.length > 0) {
            for (const entryXml of entryMatches) {
              // Extract title from Atom feed
              const titleMatch = entryXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
              const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : ''

              // Extract summary or content
              const summaryMatch = entryXml.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i) || 
                                  entryXml.match(/<content[^>]*>([\s\S]*?)<\/content>/i)
              const description = summaryMatch ? summaryMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').trim() : ''

              // Extract link from Atom feed
              const linkMatch = entryXml.match(/<link[^>]*href\s*=\s*["']([^"']+)["']/i) ||
                               entryXml.match(/<id[^>]*>(https?:\/\/[^<]+)<\/id>/i)
              const link = linkMatch ? linkMatch[1].trim() : ''

              // Extract updated or published date
              const dateMatch = entryXml.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i) ||
                               entryXml.match(/<published[^>]*>([\s\S]*?)<\/published>/i)
              const pubDate = dateMatch ? dateMatch[1].trim() : ''

              if (title && link) {
                allArticles.push({
                  title: title,
                  description: description,
                  link: link,
                  pubDate: pubDate,
                  source: source.name,
                  category: source.category
                })
              }
            }
            continue
          }
        }

        for (const itemXml of itemMatches) {
          // Extract title - handle CDATA properly
          const titleMatch = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[(.*?)\]\]>|<!--\[CDATA\[(.*?)\]-->|(.*?))<\/title>/i)
          const title = titleMatch ? (titleMatch[1] || titleMatch[2] || titleMatch[3] || '').trim() : ''

          // Extract description - handle CDATA and comments
          const descMatch = itemXml.match(/<description[^>]*>(?:<!\[CDATA\[(.*?)\]\]>|<!--\[CDATA\[(.*?)\]-->|(.*?))<\/description>/i)
          const description = descMatch ? (descMatch[1] || descMatch[2] || descMatch[3] || '').replace(/<[^>]*>/g, '').trim() : ''

          // Extract link - handle CDATA and comments
          const linkMatch = itemXml.match(/<link[^>]*>(?:<!\[CDATA\[(.*?)\]\]>|<!--\[CDATA\[(.*?)\]-->|(.*?))<\/link>/i)
          const link = linkMatch ? (linkMatch[1] || linkMatch[2] || linkMatch[3] || '').trim() : ''

          // Extract pubDate
          const pubDateMatch = itemXml.match(/<pubdate[^>]*>(.*?)<\/pubdate>/i)
          const pubDate = pubDateMatch ? pubDateMatch[1].trim() : ''

          console.log(`Parsed item: title="${title.substring(0, 50)}", link="${link}", hasDesc=${!!description}`)

          if (title && link) {
            allArticles.push({
              title: title,
              description: description,
              link: link,
              pubDate: pubDate,
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