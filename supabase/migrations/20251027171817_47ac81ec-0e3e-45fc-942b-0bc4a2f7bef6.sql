-- Create public read policies for topics
CREATE POLICY "public_read_topics" 
ON public.topics 
FOR SELECT 
USING (true);

-- Create public read policies for teams
CREATE POLICY "public_read_teams" 
ON public.teams 
FOR SELECT 
USING (true);