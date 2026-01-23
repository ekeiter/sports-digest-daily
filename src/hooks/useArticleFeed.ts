import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type FeedRow = {
  article_id: number;
  title: string;
  url: string;
  thumbnail_url: string | null;
  domain: string | null;
  published_effective: string;
  published_at: string | null;
  updated_at: string | null;
};

export type FocusFilter = {
  type: string;
  id: number;
};

async function fetchFeedPage(
  userId: string,
  cursor?: { time: string; id: number } | null,
  focus?: FocusFilter
): Promise<FeedRow[]> {
  const args: any = { p_subscriber_id: userId, p_limit: 100 };
  if (cursor) {
    args.p_cursor_time = cursor.time;
    args.p_cursor_id = cursor.id;
  }
  
  // Add focus filter if provided
  if (focus) {
    args.p_focus_type = focus.type;
    args.p_focus_id = focus.id;
  }

  const { data, error } = await supabase.rpc('get_subscriber_feed' as any, args);
  if (error) throw error;

  return (data ?? []) as FeedRow[];
}

export function useArticleFeed(userId: string | null, focus?: FocusFilter) {
  return useQuery({
    queryKey: ['articleFeed', userId, focus?.type, focus?.id],
    queryFn: () => fetchFeedPage(userId!, undefined, focus),
    enabled: !!userId,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}

export function usePrefetchArticleFeed() {
  const queryClient = useQueryClient();

  return (userId: string) => {
    // Prefetch into React Query cache
    queryClient.prefetchQuery({
      queryKey: ['articleFeed', userId],
      queryFn: () => fetchFeedPage(userId),
      staleTime: 2 * 60 * 1000,
    });
  };
}

export function useInvalidateArticleFeed() {
  const queryClient = useQueryClient();

  return (userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['articleFeed', userId] });
  };
}
