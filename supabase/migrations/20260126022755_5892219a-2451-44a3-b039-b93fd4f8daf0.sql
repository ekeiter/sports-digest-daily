-- Drop the old 5-parameter version with explicit parameter types
DROP FUNCTION IF EXISTS public.get_subscriber_feed(
  p_subscriber_id uuid, 
  p_limit integer, 
  p_cursor_time timestamp with time zone, 
  p_cursor_id bigint, 
  p_interest_id bigint
);