-- Ensure reference table is readable (needed for olympic_sports join)
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'sports' AND policyname = 'Allow public read access to sports'
  ) THEN
    CREATE POLICY "Allow public read access to sports"
    ON public.sports
    FOR SELECT
    USING (true);
  END IF;
END $$;