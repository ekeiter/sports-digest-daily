import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting: 60 requests per minute per user
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60;

// In-memory store for rate limiting (resets on cold start)
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now - value.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!userLimit || now - userLimit.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitStore.set(userId, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }

  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    const resetIn = RATE_LIMIT_WINDOW_MS - (now - userLimit.windowStart);
    return { allowed: false, remaining: 0, resetIn };
  }

  userLimit.count++;
  const resetIn = RATE_LIMIT_WINDOW_MS - (now - userLimit.windowStart);
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - userLimit.count, resetIn };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get JWT from authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's JWT for RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check rate limit
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for user ${user.id}`);
      return new Response(JSON.stringify({ 
        error: "Too many requests", 
        retryAfter: Math.ceil(rateLimit.resetIn / 1000) 
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetIn / 1000))
        },
      });
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const limit = body.limit ?? 100;
    const cursorTime = body.cursor_time ?? null;
    const cursorId = body.cursor_id ?? null;
    const interestId = body.interest_id ?? null;
    const entityType = body.entity_type ?? null;
    const entityId = body.entity_id ?? null;
    const focusLeagueId = body.focus_league_id ?? null;

    // Use service role client to call the RPC (bypasses PostgREST cache issues)
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Build the RPC call
    const rpcArgs: Record<string, unknown> = {
      p_subscriber_id: user.id,
      p_limit: limit,
    };
    
    if (cursorTime) rpcArgs.p_cursor_time = cursorTime;
    if (cursorId) rpcArgs.p_cursor_id = cursorId;
    if (interestId) rpcArgs.p_interest_id = interestId;
    if (entityType) rpcArgs.p_entity_type = entityType;
    if (entityId) rpcArgs.p_entity_id = entityId;
    if (focusLeagueId) rpcArgs.p_focus_league_id = focusLeagueId;

    const { data, error } = await adminClient.rpc("get_subscriber_feed", rpcArgs);

    if (error) {
      console.error("RPC error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data ?? []), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
