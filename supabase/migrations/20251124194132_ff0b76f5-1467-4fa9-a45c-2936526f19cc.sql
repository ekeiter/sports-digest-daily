-- Add display_options JSON column to sports and leagues for individual formatting
-- This allows storing custom styling like colors, badges, icons per entry

COMMENT ON TABLE public.sports IS 'Sports catalog with display customization options';
COMMENT ON TABLE public.leagues IS 'Leagues catalog with display customization options';

-- Add display_options to sports table
ALTER TABLE public.sports 
ADD COLUMN IF NOT EXISTS display_options jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.sports.display_options IS 'Custom display formatting options (colors, badges, styles, etc.) as JSON';

-- Add display_options to leagues table
ALTER TABLE public.leagues 
ADD COLUMN IF NOT EXISTS display_options jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.leagues.display_options IS 'Custom display formatting options (colors, badges, styles, etc.) as JSON';

-- Example usage in comments:
-- UPDATE sports SET display_options = '{"textColor": "hsl(210, 100%, 50%)", "bgColor": "hsl(210, 100%, 95%)", "badge": "NEW"}' WHERE sport = 'basketball';
-- UPDATE leagues SET display_options = '{"textColor": "hsl(0, 80%, 50%)", "icon": "🏀"}' WHERE code = 'NBA';