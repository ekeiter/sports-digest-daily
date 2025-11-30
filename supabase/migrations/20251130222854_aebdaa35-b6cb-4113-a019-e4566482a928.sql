-- Add public read policy for team_league_map table
CREATE POLICY "public_read_team_league_map"
ON team_league_map
FOR SELECT
TO public
USING (true);