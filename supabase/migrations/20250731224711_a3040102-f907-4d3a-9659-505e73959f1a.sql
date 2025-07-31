-- Enable RLS on cached_articles table
ALTER TABLE public.cached_articles ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read cached articles (they're public news)
CREATE POLICY "Articles are publicly readable" 
ON public.cached_articles 
FOR SELECT 
USING (true);

-- Only authenticated users can manage articles (for admin functions)
CREATE POLICY "Authenticated users can manage articles" 
ON public.cached_articles 
FOR ALL 
USING (auth.role() = 'authenticated'::text)
WITH CHECK (auth.role() = 'authenticated'::text);