-- Add public read policy to article_person_map for trending players feature
CREATE POLICY "Allow public read access to article_person_map"
ON public.article_person_map
FOR SELECT
USING (true);