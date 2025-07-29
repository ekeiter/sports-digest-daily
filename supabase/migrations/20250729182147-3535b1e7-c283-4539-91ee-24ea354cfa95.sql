-- Update RLS policies for rss_sources to allow management
DROP POLICY IF EXISTS "RSS sources are viewable by everyone" ON public.rss_sources;

-- Allow everyone to view active RSS sources
CREATE POLICY "RSS sources are viewable by everyone" 
ON public.rss_sources 
FOR SELECT 
USING (is_active = true);

-- Allow authenticated users to manage RSS sources
CREATE POLICY "Authenticated users can manage RSS sources" 
ON public.rss_sources 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');