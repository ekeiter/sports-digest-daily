-- Drop the old 5-parameter version of get_subscriber_feed to resolve PostgREST ambiguity
DROP FUNCTION IF EXISTS public.get_subscriber_feed(uuid, integer, timestamp with time zone, bigint, bigint);