-- Allow anyone to read league_countries (public reference data)
CREATE POLICY "Allow public read access to league_countries"
ON public.league_countries
FOR SELECT
USING (true);

-- Allow anyone to read countries (public reference data)
CREATE POLICY "Allow public read access to countries"
ON public.countries
FOR SELECT
USING (true);