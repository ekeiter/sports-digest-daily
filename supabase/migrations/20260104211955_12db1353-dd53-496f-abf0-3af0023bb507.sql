-- Allow anyone to read league_teams (public reference data)
CREATE POLICY "Allow public read access to league_teams"
ON public.league_teams
FOR SELECT
USING (true);