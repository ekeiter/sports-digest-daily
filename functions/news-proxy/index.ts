index.ts// index.ts (Supabase Edge Function)

console.log(process.env.SUPABASE_DB_URL); // Will output the database connection string

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

type UnifiedNewsItem = {
  title: string;
  description: string | null;
  url: string;
  source: string;
  publishedAt: string;
  sourceType: "newsapi" | "gnews";
};

const NEWSAPI_KEY = Deno.env.get("NEWSAPI_KEY") || "";
const GNEWS_KEY = Deno.env.get("GNEWS_KEY") || "";

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*", // tighten in production
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function deduplicate(items: UnifiedNewsItem[]): UnifiedNewsItem[] {
  const seen = new Map<string, UnifiedNewsItem>();
  for (const item of items) {
    const key = item.url || item.title;
    if (!seen.has(key)) {
      seen.set(key, item);
    }
  }
  return Array.from(seen.values());
}

async function fetchNewsAPI(
  query: string
): Promise<UnifiedNewsItem[]> {
  if (!NEWSAPI_KEY) return [];

  const from = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", query);
  url.searchParams.set("from", from);
  url.searchParams.set("language", "en");
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("pageSize", "20");
  url.searchParams.set("apiKey", NEWSAPI_KEY);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      console.warn("NewsAPI non-200:", res.status);
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data.articles)) return [];

    return data.articles.map((a: any) => ({
      title: a.title,
      description: a.description ?? null,
      url: a.url,
      source: a.source?.name || "NewsAPI",
      publishedAt: a.publishedAt,
      sourceType: "newsapi" as const,
    }));
  } catch (e) {
    console.error("NewsAPI fetch error:", e);
    return [];
  }
}

async function fetchGNews(
  query: string
): Promise<UnifiedNewsItem[]> {
  if (!GNEWS_KEY) return [];

  const from = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const url = new URL("https://gnews.io/api/v4/search");
  url.searchParams.set("q", query);
  url.searchParams.set("from", from);
  url.searchParams.set("lang", "en");
  url.searchParams.set("max", "20");
  url.searchParams.set("token", GNEWS_KEY);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      console.warn("GNews non-200:", res.status);
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data.articles)) return [];

    return data.articles.map((a: any) => ({
      title: a.title,
      description: a.description ?? null,
      url: a.url,
      source: a.source || "GNews",
      publishedAt: a.publishedAt,
      sourceType: "gnews" as const,
    }));
  } catch (e) {
    console.error("GNews fetch error:", e);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") || "";
    if (!q) {
      return new Response(
        JSON.stringify({ error: "Missing query parameter 'q'" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const [newsapiResults, gnewsResults] = await Promise.all([
      fetchNewsAPI(q),
      fetchGNews(q),
    ]);

    const unified = deduplicate([...newsapiResults, ...gnewsResults]);

    return new Response(
      JSON.stringify({ articles: unified }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (e) {
    console.error("Edge function internal error:", e);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
