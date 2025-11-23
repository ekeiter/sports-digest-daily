-- Ensure RLS is enabled and a SELECT policy exists for people
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'people'
      AND policyname = 'public_read_people'
  ) THEN
    CREATE POLICY public_read_people
      ON public.people
      FOR SELECT
      USING (true);
  END IF;
END $$;