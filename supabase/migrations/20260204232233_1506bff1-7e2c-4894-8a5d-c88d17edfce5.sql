-- Drop the old bigint-signature version that's causing the overload conflict
DROP FUNCTION IF EXISTS public.get_subscriber_feed(uuid, int, timestamptz, bigint, bigint, text, bigint, bigint);