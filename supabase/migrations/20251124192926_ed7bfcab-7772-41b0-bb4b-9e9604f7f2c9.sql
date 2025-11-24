-- Add app_order_id and display_label to leagues table
ALTER TABLE public.leagues
ADD COLUMN app_order_id integer,
ADD COLUMN display_label text;

-- Add app_order_id and display_label to sports table
ALTER TABLE public.sports
ADD COLUMN app_order_id integer,
ADD COLUMN display_label text;

-- Add comments for documentation
COMMENT ON COLUMN public.leagues.app_order_id IS 'Display order in preferences UI. NULL = hidden from preferences';
COMMENT ON COLUMN public.leagues.display_label IS 'Custom display name for UI. NULL = use league name';
COMMENT ON COLUMN public.sports.app_order_id IS 'Display order in preferences UI. NULL = hidden from preferences';
COMMENT ON COLUMN public.sports.display_label IS 'Custom display name for UI. NULL = use sport display_name';