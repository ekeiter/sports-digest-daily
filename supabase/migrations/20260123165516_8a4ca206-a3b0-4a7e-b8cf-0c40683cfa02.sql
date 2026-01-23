-- Drop the old function signature first (without p_interest_id)
DROP FUNCTION IF EXISTS public.get_subscriber_feed(uuid, integer, timestamp with time zone, bigint);

-- The new function with p_interest_id parameter already exists, so no need to recreate it