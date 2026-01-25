
-- Force PostgREST to reload schema by altering function search_path
-- This is a no-op change that triggers schema reload
ALTER FUNCTION public.get_subscriber_feed(uuid, integer, timestamptz, bigint, bigint) 
SET search_path = public;

-- Also explicitly notify PostgREST
NOTIFY pgrst, 'reload schema';
