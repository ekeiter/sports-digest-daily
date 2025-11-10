-- Enable RLS on sports table
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;

-- Add read policy for sports table (public read access)
CREATE POLICY "public_read_sports"
ON public.sports
FOR SELECT
USING (true);