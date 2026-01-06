-- Enable RLS on olympic_sports if not already enabled
ALTER TABLE public.olympic_sports ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access" 
ON public.olympic_sports 
FOR SELECT 
USING (true);