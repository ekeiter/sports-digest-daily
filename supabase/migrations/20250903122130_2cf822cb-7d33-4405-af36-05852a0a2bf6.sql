-- Temporarily disable RLS on user preference tables for testing
ALTER TABLE user_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sports DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_players DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_config DISABLE ROW LEVEL SECURITY;