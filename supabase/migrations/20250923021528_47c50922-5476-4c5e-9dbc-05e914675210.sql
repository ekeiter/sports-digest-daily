-- Add image_url column to cached_articles table
ALTER TABLE cached_articles 
ADD COLUMN IF NOT EXISTS image_url TEXT;