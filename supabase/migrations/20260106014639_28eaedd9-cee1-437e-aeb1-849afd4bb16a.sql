-- Add display_options column to preference_menu_items
ALTER TABLE public.preference_menu_items 
ADD COLUMN display_options jsonb DEFAULT '{}'::jsonb;