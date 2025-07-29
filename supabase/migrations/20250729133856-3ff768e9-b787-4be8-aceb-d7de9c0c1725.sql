-- Create table for RSS feed sources
CREATE TABLE public.rss_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.rss_sources ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (admin managed)
CREATE POLICY "RSS sources are viewable by everyone" 
ON public.rss_sources 
FOR SELECT 
USING (is_active = true);

-- Insert default RSS sources for major sports sites
INSERT INTO public.rss_sources (name, url, category) VALUES 
('ESPN - Top Headlines', 'https://www.espn.com/espn/rss/news', 'General Sports'),
('ESPN - MLB', 'https://www.espn.com/espn/rss/mlb/news', 'Baseball'),
('ESPN - NFL', 'https://www.espn.com/espn/rss/nfl/news', 'Football'),
('ESPN - NBA', 'https://www.espn.com/espn/rss/nba/news', 'Basketball'),
('ESPN - NHL', 'https://www.espn.com/espn/rss/nhl/news', 'Hockey'),
('MLB.com - News', 'https://www.mlb.com/feeds/news/rss.xml', 'Baseball'),
('NFL.com - News', 'https://www.nfl.com/feeds/rss/news', 'Football'),
('NBA.com - News', 'https://www.nba.com/news/rss.xml', 'Basketball'),
('Associated Press - Sports', 'https://feeds.apnews.com/rss/apf-sports.rss', 'General Sports'),
('CBS Sports - NFL', 'https://www.cbssports.com/rss/headlines/nfl/', 'Football'),
('CBS Sports - MLB', 'https://www.cbssports.com/rss/headlines/mlb/', 'Baseball');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_rss_sources_updated_at
BEFORE UPDATE ON public.rss_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();