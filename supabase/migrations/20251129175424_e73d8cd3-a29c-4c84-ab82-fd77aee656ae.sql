-- Add indexes to improve feed query performance

-- Indexes on article mapping tables for faster joins
CREATE INDEX IF NOT EXISTS idx_article_team_map_article_team 
  ON article_team_map(article_id, team_id);

CREATE INDEX IF NOT EXISTS idx_article_person_map_article_person 
  ON article_person_map(article_id, person_id);

CREATE INDEX IF NOT EXISTS idx_article_league_map_article_league 
  ON article_league_map(article_id, league_id);

CREATE INDEX IF NOT EXISTS idx_article_sport_map_article_sport 
  ON article_sport_map(article_id, sport_id);

-- Composite index on subscriber_interests for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriber_interests_lookup 
  ON subscriber_interests(subscriber_id, kind, subject_id, is_focused);

-- Index on articles for feed ordering
CREATE INDEX IF NOT EXISTS idx_articles_published_effective 
  ON articles((COALESCE(published_at, updated_at, created_at)), id DESC);