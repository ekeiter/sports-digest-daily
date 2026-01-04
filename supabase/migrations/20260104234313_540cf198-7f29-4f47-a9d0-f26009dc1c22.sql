-- Add RLS policies for league_schools table
ALTER TABLE public.league_schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on league_schools" 
ON public.league_schools 
FOR SELECT 
USING (true);

-- Add RLS policies for schools table
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on schools" 
ON public.schools 
FOR SELECT 
USING (true);