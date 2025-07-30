-- Add sport and city columns to rss_sources table
ALTER TABLE public.rss_sources 
ADD COLUMN sport TEXT NOT NULL DEFAULT 'General',
ADD COLUMN city TEXT NOT NULL DEFAULT 'General';

-- Drop the category column since we're replacing it with sport and city
ALTER TABLE public.rss_sources 
DROP COLUMN category;