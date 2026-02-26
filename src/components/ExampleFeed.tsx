import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ArticleImage from "@/components/ArticleImage";
import ArticlePlaceholder from "@/components/ArticlePlaceholder";
import { openUrl } from "@/hooks/useOpenUrl";

type ExampleArticle = {
  id: number;
  title: string;
  url: string;
  thumbnail_url: string | null;
  published_at: string | null;
  url_domain: string;
  league_code: string;
};

// League IDs: EPL=1, MLB=64, MLS=24, NBA=47, NCAAF=52, NCAAM=49, NFL=51, NHL=58, UCL=35
const LEAGUE_IDS = [1, 64, 24, 47, 52, 49, 51, 58, 35];

function formatTimeAgo(dateString: string | null) {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    const mins = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
    if (mins < 1) return "now";
    if (mins < 120) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  } catch {
    return "";
  }
}

export default function ExampleFeed() {
  const [articles, setArticles] = useState<ExampleArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExampleArticles();
    const interval = setInterval(fetchExampleArticles, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchExampleArticles() {
    try {
      // Fetch recent articles from the target leagues, 2 per league-ish, then pick 10
      const { data, error } = await supabase
        .from("article_league_map")
        .select(`
          league_id,
          article_id,
          articles!inner (
            id,
            title,
            url,
            thumbnail_url,
            published_at,
            url_domain,
            is_duplicate
          )
        `)
        .in("league_id", LEAGUE_IDS)
        .eq("articles.is_duplicate", false)
        .not("articles.title", "is", null)
        .order("article_id", { ascending: false })
        .limit(100);

      if (error || !data) {
        console.error("Example feed error:", error);
        setLoading(false);
        return;
      }

      // Pick a diverse mix: up to ~2 per league, then fill to 10
      const byLeague = new Map<number, ExampleArticle[]>();
      const leagueCodeMap: Record<number, string> = {
        1: "EPL", 64: "MLB", 24: "MLS", 47: "NBA",
        52: "NCAAF", 49: "NCAAM", 51: "NFL", 58: "NHL", 35: "UCL",
      };

      for (const row of data) {
        const a = row.articles as any;
        if (!a?.title) continue;
        const lid = row.league_id;
        if (!byLeague.has(lid)) byLeague.set(lid, []);
        byLeague.get(lid)!.push({
          id: a.id,
          title: a.title,
          url: a.url,
          thumbnail_url: a.thumbnail_url,
          published_at: a.published_at,
          url_domain: a.url_domain,
          league_code: leagueCodeMap[lid] || "",
        });
      }

      // Round-robin pick
      const result: ExampleArticle[] = [];
      const seenIds = new Set<number>();
      let round = 0;
      while (result.length < 10 && round < 5) {
        for (const lid of LEAGUE_IDS) {
          if (result.length >= 10) break;
          const pool = byLeague.get(lid) || [];
          if (round < pool.length && !seenIds.has(pool[round].id)) {
            seenIds.add(pool[round].id);
            result.push(pool[round]);
          }
        }
        round++;
      }

      // Sort by published_at descending
      result.sort((a, b) => {
        const da = a.published_at ? new Date(a.published_at).getTime() : 0;
        const db = b.published_at ? new Date(b.published_at).getTime() : 0;
        return db - da;
      });
      setArticles(result);
    } catch (err) {
      console.error("Example feed fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-lg mx-auto space-y-3 pt-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="w-full h-48 rounded-md" />
        ))}
      </div>
    );
  }

  if (articles.length === 0) return null;

  return (
    <div className="w-full max-w-lg mx-auto pt-4 md:pt-6">
      <h3 className="text-sm md:text-base font-bold text-foreground text-center mb-3">
        An example of the real-time coverage available in SportsDig
      </h3>
      <div className="space-y-0">
        {articles.map((article) => (
          <Card key={article.id} className="overflow-hidden rounded-none border-0 shadow-none border-b">
            <CardContent className="p-0">
              <button
                type="button"
                onClick={() => openUrl(article.url)}
                className="block w-full text-left hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className="flex flex-col">
                  <div className="w-full">
                    {article.thumbnail_url ? (
                      <ArticleImage src={article.thumbnail_url} className="w-full aspect-video object-cover" />
                    ) : (
                      <ArticlePlaceholder />
                    )}
                  </div>
                  <div className="px-3 pt-1.5 pb-2">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mb-0.5">
                      <span>{article.url_domain || "Unknown source"}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(article.published_at)}</span>
                    </div>
                    <h3 className="font-semibold text-sm line-clamp-3">
                      {article.title}
                    </h3>
                  </div>
                </div>
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
