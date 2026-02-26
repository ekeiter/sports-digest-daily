CREATE POLICY "Allow public read access to article_league_map"
ON public.article_league_map
FOR SELECT
USING (true);