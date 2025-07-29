import axios from "axios";
import Parser from "rss-parser";
import rssFeeds from "./rssFeeds.json";

// Note: These should be moved to edge functions for security
const NEWSAPI_KEY = "fde0ff5a328f4555b6351aecd05fdb7d";
const GNEWS_KEY = "439cd65bb32110496ba054e64e61f489";

const paywalledDomains = [
  "theathletic.com", "nytimes.com", "wsj.com", "bloomberg.com"
  // Add more here as needed
];

type NewsArticle = {
  title: string;
  description?: string;
  url: string;
  source: string;
  publishedAt: string;
  paywalled?: boolean;
  sourceType: "newsapi" | "gnews" | "rss";
};

function deduplicate(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set();
  return articles.filter(a => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });
}

export async function fetchUnifiedNews(topics: string[]): Promise<NewsArticle[]> {
  const query = topics.map(t => `"${t}"`).join(" OR ");
  const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // 1. NewsAPI
  const newsapiPromise = axios.get("https://newsapi.org/v2/everything", {
    params: {
      q: query,
      from,
      language: "en",
      sortBy: "publishedAt",
      apiKey: NEWSAPI_KEY,
      pageSize: 20,
    },
  }).then(res =>
    (res.data.articles || []).map((a: any) => ({
      title: a.title,
      description: a.description,
      url: a.url,
      source: a.source?.name || "",
      publishedAt: a.publishedAt,
      sourceType: "newsapi" as const
    }))
  ).catch(() => []);

  // 2. GNews
  const gnewsPromise = axios.get("https://gnews.io/api/v4/search", {
    params: {
      q: query,
      from,
      lang: "en",
      token: GNEWS_KEY,
      max: 20
    }
  }).then(res =>
    (res.data.articles || []).map((a: any) => ({
      title: a.title,
      description: a.description,
      url: a.url,
      source: a.source?.name || "",
      publishedAt: a.publishedAt || a.published_at,
      sourceType: "gnews" as const
    }))
  ).catch(() => []);

  // 3. RSS Feeds (for all topics)
  const parser = new Parser();
  const topicFeeds = topics.flatMap(t => (rssFeeds[t] || []));
  const uniqueFeeds = [...new Set(topicFeeds)];
  const rssPromises = uniqueFeeds.map(feed =>
    parser.parseURL(feed)
      .then(f => f.items.map(item => ({
        title: item.title ?? "",
        description: item.contentSnippet ?? item.summary ?? "",
        url: item.link ?? "",
        source: f.title ?? "",
        publishedAt: item.pubDate ?? "",
        sourceType: "rss" as const
      })))
      .catch(() => [])
  );

  // Aggregate
  const [newsapi, gnews, ...rssFeedsResults] = await Promise.all([newsapiPromise, gnewsPromise, ...rssPromises]);
  let allArticles: NewsArticle[] = [...newsapi, ...gnews, ...rssFeedsResults.flat()];

  // Deduplicate and tag paywalls
  allArticles = deduplicate(allArticles).map(a => ({
    ...a,
    paywalled: paywalledDomains.some(domain => a.url.includes(domain))
  }));

  // Optional: sort newest first
  allArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return allArticles;
}
