-- Remove foreign key constraints temporarily for testing
ALTER TABLE user_teams DROP CONSTRAINT IF EXISTS user_teams_user_id_fkey;
ALTER TABLE user_sports DROP CONSTRAINT IF EXISTS user_sports_user_id_fkey;
ALTER TABLE user_players DROP CONSTRAINT IF EXISTS user_players_user_id_fkey;
ALTER TABLE news_config DROP CONSTRAINT IF EXISTS news_config_user_id_fkey;