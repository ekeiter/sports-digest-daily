-- Drop the existing league check constraint
ALTER TABLE public.user_teams DROP CONSTRAINT IF EXISTS user_teams_league_check;

-- Add updated check constraint with all leagues including NCAAM, NCAAF, and WNBA
ALTER TABLE public.user_teams ADD CONSTRAINT user_teams_league_check 
  CHECK (league = ANY (ARRAY['MLB'::text, 'NFL'::text, 'NBA'::text, 'NHL'::text, 'WNBA'::text, 'NCAAF'::text, 'NCAAM'::text]));