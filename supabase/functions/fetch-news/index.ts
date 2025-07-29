import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const NEWS_API_KEY = 'fde0ff5a328f4555b6351aecd05fdb7d'

interface NewsRequest {
  query?: string
  category?: string
  sources?: string
  language?: string
  pageSize?: number
  page?: number
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
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Set the auth token for supabase client
    supabase.auth.setSession({
      access_token: authHeader.replace('Bearer ', ''),
      refresh_token: ''
    })

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body: NewsRequest = await req.json()
    console.log('News request:', body)

    // Build NewsAPI URL
    const baseUrl = 'https://newsapi.org/v2/everything'
    const params = new URLSearchParams()
    
    if (body.query) {
      params.append('q', body.query)
    }
    if (body.sources) {
      params.append('sources', body.sources)
    }
    if (body.language) {
      params.append('language', body.language)
    } else {
      params.append('language', 'en')
    }
    if (body.pageSize) {
      params.append('pageSize', body.pageSize.toString())
    } else {
      params.append('pageSize', '20')
    }
    if (body.page) {
      params.append('page', body.page.toString())
    }
    
    // Add date filter to get recent articles
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - 7) // Last 7 days
    params.append('from', fromDate.toISOString().split('T')[0])
    params.append('sortBy', 'publishedAt')

    const newsUrl = `${baseUrl}?${params.toString()}`
    console.log('Fetching news from:', newsUrl)

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
    console.log('News data received:', { totalResults: newsData.totalResults, articlesCount: newsData.articles?.length })

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