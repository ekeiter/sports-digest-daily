-- Enable RLS on subscriber_interests (if not already)
ALTER TABLE public.subscriber_interests ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own interests
CREATE POLICY "Users can view their own interests"
ON public.subscriber_interests
FOR SELECT
USING (auth.uid() = subscriber_id);

-- Allow users to insert their own interests
CREATE POLICY "Users can insert their own interests"
ON public.subscriber_interests
FOR INSERT
WITH CHECK (auth.uid() = subscriber_id);

-- Allow users to update their own interests
CREATE POLICY "Users can update their own interests"
ON public.subscriber_interests
FOR UPDATE
USING (auth.uid() = subscriber_id);

-- Allow users to delete their own interests
CREATE POLICY "Users can delete their own interests"
ON public.subscriber_interests
FOR DELETE
USING (auth.uid() = subscriber_id);