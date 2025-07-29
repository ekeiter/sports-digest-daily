import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const NEWS_API_KEY = 'fde0ff5a328f4555b6351aecd05fdb7d'

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

    console.log('Fetching news for user:', user.id)

    // Get user's teams, sports, and players
    const [teamsResponse, sportsResponse, playersResponse] = await Promise.all([
      supabase.from('user_teams').select('team_name, league').eq('user_id', user.id),
      supabase.from('user_sports').select('sport_name').eq('user_id', user.id),
      supabase.from('user_players').select('player_name, sport').eq('user_id', user.id)
    ])

    if (teamsResponse.error || sportsResponse.error || playersResponse.error) {
      console.error('Database errors:', { 
        teams: teamsResponse.error, 
        sports: sportsResponse.error, 
        players: playersResponse.error 
      })
    }

    const teams = teamsResponse.data || []
    const sports = sportsResponse.data || []
    const players = playersResponse.data || []

    console.log('User preferences:', { 
      teamsCount: teams.length, 
      sportsCount: sports.length, 
      playersCount: players.length 
    })

    // Build search queries based on user preferences
    let searchQueries: string[] = []

    // Add team-based queries
    teams.forEach(team => {
      searchQueries.push(`"${team.team_name}"`)
    })

    // Add sport-based queries
    sports.forEach(sport => {
      searchQueries.push(sport.sport_name)
    })

    // Add player-based queries
    players.forEach(player => {
      searchQueries.push(`"${player.player_name}"`)
    })

    // Default to general sports if no preferences
    if (searchQueries.length === 0) {
      searchQueries.push('sports')
    }

    // Combine queries (limit to avoid URL length issues)
    const query = searchQueries.slice(0, 10).join(' OR ')
    console.log('Search query:', query)

    // Build NewsAPI URL
    const baseUrl = 'https://newsapi.org/v2/everything'
    const params = new URLSearchParams()
    
    params.append('q', query)
    params.append('language', 'en')
    params.append('pageSize', '20')
    params.append('sortBy', 'publishedAt')
    
    // Add date filter to get recent articles (last 7 days)
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - 7)
    params.append('from', fromDate.toISOString().split('T')[0])

    const newsUrl = `${baseUrl}?${params.toString()}`
    console.log('Fetching from NewsAPI:', newsUrl.substring(0, 100) + '...')

    // Fetch news from NewsAPI
    const newsResponse = await fetch(newsUrl, {
      headers: {
        'X-API-Key': NEWS_API_KEY,
        'User-Agent': 'Sports-Digest-App/1.0'
      }
    })

    if (!newsResponse.ok) {
      const errorText = await newsResponse.text()
      console.error('NewsAPI error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch news', details: errorText }),
        { status: newsResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const newsData = await newsResponse.json()
    console.log('News data received:', { 
      status: newsData.status,
      totalResults: newsData.totalResults, 
      articlesCount: newsData.articles?.length 
    })

    // Filter articles to be more relevant to sports
    if (newsData.articles) {
      newsData.articles = newsData.articles.filter((article: any) => {
        const content = `${article.title} ${article.description || ''}`.toLowerCase()
        const sportsKeywords = ['sport', 'game', 'team', 'player', 'league', 'season', 'match', 'championship', 'tournament', 'score', 'win', 'loss']
        return sportsKeywords.some(keyword => content.includes(keyword))
      })
    }

    return new Response(
      JSON.stringify(newsData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in fetch-news function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})