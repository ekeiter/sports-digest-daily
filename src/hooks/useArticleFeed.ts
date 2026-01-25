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

async function fetchFeedPage(
  userId: string,
  cursor?: { time: string; id: number } | null,
  interestId?: number
): Promise<FeedRow[]> {
  // Get the current session for auth header
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("No active session");
  }

  // Build request body
  const body: Record<string, unknown> = { limit: 100 };
  if (cursor) {
    body.cursor_time = cursor.time;
    body.cursor_id = cursor.id;
  }
  if (interestId) {
    body.interest_id = interestId;
  }

  // Call the edge function instead of direct RPC (bypasses PostgREST cache)
  const response = await supabase.functions.invoke("get-feed", {
    body,
  });

  if (response.error) {
    throw new Error(response.error.message || "Failed to fetch feed");
  }

  return (response.data ?? []) as FeedRow[];
}

export function useArticleFeed(userId: string | null, interestId?: number) {
  // Only include interestId in queryKey if it's defined (avoids cache key mismatch)
  const queryKey = interestId 
    ? ['articleFeed', userId, interestId] 
    : ['articleFeed', userId];
    
  return useQuery({
    queryKey,
    queryFn: () => fetchFeedPage(userId!, undefined, interestId),
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

  return (userId: string, interestId?: number) => {
    if (interestId) {
      queryClient.invalidateQueries({ queryKey: ['articleFeed', userId, interestId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['articleFeed', userId] });
    }
  };
}
