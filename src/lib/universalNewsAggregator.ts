import axios from "axios";

export type UnifiedNewsItem = {
  title: string;
  description: string | null;
  url: string;
  source: string;
  publishedAt: string;
  sourceType: "newsapi" | "gnews" | "other";
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

/**
 * Fetches unified news via a secure edge function proxy instead of calling upstream APIs directly.
 */
export async function fetchUnifiedNews(
  query: string
): Promise<UnifiedNewsItem[]> {
  try {
    const resp = await axios.get("/api/news-proxy", {
      params: { q: query },
      timeout: 10_000,
    });

    if (!resp.data || !Array.isArray(resp.data.articles)) {
      console.warn("Edge function returned unexpected shape", resp.data);
      return [];
    }

    const items: UnifiedNewsItem[] = resp.data.articles.map((a: any) => ({
      title: a.title,
      description: a.description ?? null,
      url: a.url,
      source: a.source,
      publishedAt: a.publishedAt,
      sourceType: a.sourceType,
    }));

    return deduplicate(items);
  } catch (err: any) {
    console.error("Failed to fetch unified news:", err?.message || err);
    return [];
  }
}
