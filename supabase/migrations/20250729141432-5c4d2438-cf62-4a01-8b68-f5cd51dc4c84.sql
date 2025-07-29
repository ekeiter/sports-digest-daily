-- Add more comprehensive RSS sources for better coverage
INSERT INTO rss_sources (name, url, category) VALUES
-- Philadelphia sports specific
('Philadelphia Inquirer - Sports', 'https://www.inquirer.com/arc/outboundfeeds/rss/category/sports/?outputType=xml', 'Philadelphia Sports'),
('NBC Sports Philadelphia', 'https://www.nbcsports.com/philadelphia/feed', 'Philadelphia Sports'),
-- More baseball sources
('The Athletic - MLB', 'https://theathletic.com/rss/', 'Baseball'),
('Baseball America', 'https://www.baseballamerica.com/rss/all/', 'Baseball'),
('Sports Illustrated - MLB', 'https://www.si.com/rss/mlb.rss', 'Baseball'),
-- More general sports that might cover Phillies
('Yahoo Sports - MLB', 'https://sports.yahoo.com/mlb/rss.xml', 'Baseball'),
('Fox Sports - MLB', 'https://www.foxsports.com/rss/mlb', 'Baseball'),
-- Pittsburgh sports for Paul Skenes coverage
('Pittsburgh Post-Gazette - Sports', 'https://www.post-gazette.com/rss/sports', 'Pittsburgh Sports'),
('DK Pittsburgh Sports', 'https://www.dkpittsburghsports.com/feed', 'Pittsburgh Sports');