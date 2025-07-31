-- Create cached_articles table for storing news articles
CREATE TABLE public.cached_articles (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL UNIQUE,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_fetched TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_cached_articles_source ON public.cached_articles(source);
CREATE INDEX idx_cached_articles_published_at ON public.cached_articles(published_at DESC);
CREATE INDEX idx_cached_articles_last_fetched ON public.cached_articles(last_fetched);

-- Create trigger to automatically update last_fetched on updates
CREATE TRIGGER update_cached_articles_last_fetched
  BEFORE UPDATE ON public.cached_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();