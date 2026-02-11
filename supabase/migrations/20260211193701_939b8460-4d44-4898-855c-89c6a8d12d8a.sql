
-- Update the matched_interests logic in get_subscriber_feed to:
-- 1. Use preference_menu_items as fallback for league logos
-- 2. Emit school format for "All Sports" schools
-- 3. Emit country format with flag only (no country name text)

CREATE OR REPLACE FUNCTION get_subscriber_feed(
  p_subscriber_id uuid,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id integer,
  title text,
  url text,
  excerpt text,
  lead_image_url text,
  published_at timestamptz,
  source_display_name text,
  domain text,
  media_type text,
  media_url text,
  matched_interests text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_interest_count integer;
BEGIN
  -- Count user interests
  SELECT count(*) INTO v_interest_count
  FROM subscriber_interests si
  WHERE si.subscriber_id = p_subscriber_id;

  IF v_interest_count = 0 THEN
    RETURN;
  END IF;

  -- Create temp table for result article IDs
  CREATE TEMP TABLE IF NOT EXISTS temp_result_articles (article_id integer PRIMARY KEY) ON COMMIT DROP;
  TRUNCATE temp_result_articles;

  -- Sport-only interests (no league, no team, no school, no country, no person, not olympics)
  INSERT INTO temp_result_articles (article_id)
  SELECT DISTINCT a.id::integer
  FROM articles a
  JOIN article_sport_map asm ON a.id = asm.article_id
  JOIN subscriber_interests si ON asm.sport_id = si.sport_id
    AND si.subscriber_id = p_subscriber_id
    AND si.league_id IS NULL AND si.team_id IS NULL AND si.school_id IS NULL
    AND si.country_id IS NULL AND si.person_id IS NULL AND si.is_olympics = false
  WHERE a.is_duplicate = false
    AND a.published_at > now() - interval '7 days'
  ON CONFLICT DO NOTHING;

  -- League interests
  INSERT INTO temp_result_articles (article_id)
  SELECT DISTINCT a.id::integer
  FROM articles a
  JOIN article_league_map alm ON a.id = alm.article_id
  JOIN subscriber_interests si ON alm.league_id = si.league_id
    AND si.subscriber_id = p_subscriber_id
    AND si.team_id IS NULL AND si.school_id IS NULL
    AND si.country_id IS NULL AND si.person_id IS NULL AND si.is_olympics = false
  WHERE a.is_duplicate = false
    AND a.published_at > now() - interval '7 days'
  ON CONFLICT DO NOTHING;

  -- Team interests
  INSERT INTO temp_result_articles (article_id)
  SELECT DISTINCT a.id::integer
  FROM articles a
  JOIN article_team_map atm ON a.id = atm.article_id
  JOIN subscriber_interests si ON atm.team_id = si.team_id
    AND si.subscriber_id = p_subscriber_id
  WHERE a.is_duplicate = false
    AND a.published_at > now() - interval '7 days'
  ON CONFLICT DO NOTHING;

  -- School + league interests
  INSERT INTO temp_result_articles (article_id)
  SELECT DISTINCT a.id::integer
  FROM articles a
  JOIN article_school_map aschm ON a.id = aschm.article_id
  JOIN subscriber_interests si ON aschm.school_id = si.school_id
    AND si.subscriber_id = p_subscriber_id
    AND si.league_id IS NOT NULL
  JOIN article_league_map alm ON a.id = alm.article_id AND alm.league_id = si.league_id
  WHERE a.is_duplicate = false
    AND a.published_at > now() - interval '7 days'
  ON CONFLICT DO NOTHING;

  -- School without league (all sports)
  INSERT INTO temp_result_articles (article_id)
  SELECT DISTINCT a.id::integer
  FROM articles a
  JOIN article_school_map aschm ON a.id = aschm.article_id
  JOIN subscriber_interests si ON aschm.school_id = si.school_id
    AND si.subscriber_id = p_subscriber_id
    AND si.league_id IS NULL
  WHERE a.is_duplicate = false
    AND a.published_at > now() - interval '7 days'
  ON CONFLICT DO NOTHING;

  -- Person interests
  INSERT INTO temp_result_articles (article_id)
  SELECT DISTINCT a.id::integer
  FROM articles a
  JOIN article_person_map apm ON a.id = apm.article_id
  JOIN subscriber_interests si ON apm.person_id = si.person_id
    AND si.subscriber_id = p_subscriber_id
  WHERE a.is_duplicate = false
    AND a.published_at > now() - interval '7 days'
  ON CONFLICT DO NOTHING;

  -- Country + League interests (non-Olympics)
  INSERT INTO temp_result_articles (article_id)
  SELECT DISTINCT a.id::integer
  FROM articles a
  JOIN article_country_map acm ON a.id = acm.article_id
  JOIN subscriber_interests si ON acm.country_id = si.country_id
    AND si.subscriber_id = p_subscriber_id
    AND si.is_olympics = false AND si.league_id IS NOT NULL
  JOIN article_league_map alm ON a.id = alm.article_id AND alm.league_id = si.league_id
  WHERE a.is_duplicate = false
    AND a.published_at > now() - interval '7 days'
  ON CONFLICT DO NOTHING;

  -- Olympics (general)
  INSERT INTO temp_result_articles (article_id)
  SELECT DISTINCT a.id::integer
  FROM articles a
  JOIN subscriber_interests si ON si.is_olympics = true
    AND si.subscriber_id = p_subscriber_id
    AND si.sport_id IS NULL AND si.country_id IS NULL
  WHERE a.is_olympics = true
    AND a.is_duplicate = false
    AND a.published_at > now() - interval '7 days'
  ON CONFLICT DO NOTHING;

  -- Olympics + sport
  INSERT INTO temp_result_articles (article_id)
  SELECT DISTINCT a.id::integer
  FROM articles a
  JOIN article_sport_map asm ON a.id = asm.article_id
  JOIN subscriber_interests si ON asm.sport_id = si.sport_id
    AND si.subscriber_id = p_subscriber_id
    AND si.is_olympics = true
  WHERE a.is_olympics = true
    AND a.is_duplicate = false
    AND a.published_at > now() - interval '7 days'
  ON CONFLICT DO NOTHING;

  -- Olympics + country
  INSERT INTO temp_result_articles (article_id)
  SELECT DISTINCT a.id::integer
  FROM articles a
  JOIN article_country_map acm ON a.id = acm.article_id
  JOIN subscriber_interests si ON acm.country_id = si.country_id
    AND si.subscriber_id = p_subscriber_id
    AND si.is_olympics = true
  WHERE a.is_olympics = true
    AND a.is_duplicate = false
    AND a.published_at > now() - interval '7 days'
  ON CONFLICT DO NOTHING;

  -- Olympics + sport + country
  INSERT INTO temp_result_articles (article_id)
  SELECT DISTINCT a.id::integer
  FROM articles a
  JOIN article_sport_map asm ON a.id = asm.article_id
  JOIN article_country_map acm ON a.id = acm.article_id
  JOIN subscriber_interests si ON asm.sport_id = si.sport_id
    AND acm.country_id = si.country_id
    AND si.subscriber_id = p_subscriber_id
    AND si.is_olympics = true
  WHERE a.is_olympics = true
    AND a.is_duplicate = false
    AND a.published_at > now() - interval '7 days'
  ON CONFLICT DO NOTHING;

  -- Build matched interests
  CREATE TEMP TABLE IF NOT EXISTS temp_matched (article_id integer, label text) ON COMMIT DROP;
  TRUNCATE temp_matched;

  -- Teams: use nickname if available
  INSERT INTO temp_matched (article_id, label)
  SELECT tr.article_id, COALESCE(t.nickname, t.display_name)
  FROM temp_result_articles tr
  JOIN article_team_map atm ON tr.article_id = atm.article_id
  JOIN teams t ON atm.team_id = t.id
  JOIN subscriber_interests si ON si.team_id = t.id AND si.subscriber_id = p_subscriber_id;

  -- People
  INSERT INTO temp_matched (article_id, label)
  SELECT tr.article_id, p.name
  FROM temp_result_articles tr
  JOIN article_person_map apm ON tr.article_id = apm.article_id
  JOIN people p ON apm.person_id = p.id
  JOIN subscriber_interests si ON si.person_id = p.id AND si.subscriber_id = p_subscriber_id;

  -- Leagues
  INSERT INTO temp_matched (article_id, label)
  SELECT tr.article_id, COALESCE(l.display_label, l.name, l.code)
  FROM temp_result_articles tr
  JOIN article_league_map alm ON tr.article_id = alm.article_id
  JOIN leagues l ON alm.league_id = l.id
  JOIN subscriber_interests si ON si.league_id = l.id AND si.subscriber_id = p_subscriber_id
    AND si.team_id IS NULL AND si.school_id IS NULL AND si.country_id IS NULL
    AND si.person_id IS NULL AND si.is_olympics = false;

  -- Sports (standalone)
  INSERT INTO temp_matched (article_id, label)
  SELECT tr.article_id, COALESCE(sp.display_label, sp.sport)
  FROM temp_result_articles tr
  JOIN article_sport_map asm ON tr.article_id = asm.article_id
  JOIN sports sp ON asm.sport_id = sp.id
  JOIN subscriber_interests si ON si.sport_id = sp.id AND si.subscriber_id = p_subscriber_id
    AND si.league_id IS NULL AND si.is_olympics = false;

  -- Schools WITH league: use preference_menu_items as fallback for logo
  INSERT INTO temp_matched (article_id, label)
  SELECT tr.article_id, 'school:' || COALESCE(sc.short_name, sc.name) || ':' || l.code || ':' || COALESCE(l.logo_url, pmi.logo_url, '')
  FROM temp_result_articles tr
  JOIN article_school_map aschm ON tr.article_id = aschm.article_id
  JOIN schools sc ON aschm.school_id = sc.id
  JOIN subscriber_interests si ON si.school_id = sc.id AND si.subscriber_id = p_subscriber_id
  JOIN leagues l ON si.league_id = l.id
  JOIN article_league_map alm ON tr.article_id = alm.article_id AND alm.league_id = l.id
  LEFT JOIN preference_menu_items pmi ON pmi.entity_type = 'league' AND pmi.entity_id = l.id
  WHERE si.league_id IS NOT NULL;

  -- Schools WITHOUT league: emit school format with empty league for "- All" display
  INSERT INTO temp_matched (article_id, label)
  SELECT tr.article_id, 'school:' || COALESCE(sc.short_name, sc.name) || '::'
  FROM temp_result_articles tr
  JOIN article_school_map aschm ON tr.article_id = aschm.article_id
  JOIN schools sc ON aschm.school_id = sc.id
  JOIN subscriber_interests si ON si.school_id = sc.id AND si.subscriber_id = p_subscriber_id
    AND si.league_id IS NULL;

  -- Country + League (non-Olympics): emit "country:LeagueName:flag_url"
  INSERT INTO temp_matched (article_id, label)
  SELECT tr.article_id, 'country:' || COALESCE(l.display_label, l.name, l.code) || ':' || COALESCE(c.logo_url, '')
  FROM temp_result_articles tr
  JOIN article_country_map acm ON tr.article_id = acm.article_id
  JOIN countries c ON acm.country_id = c.id
  JOIN subscriber_interests si ON si.country_id = c.id AND si.subscriber_id = p_subscriber_id
  JOIN leagues l ON si.league_id = l.id
  JOIN article_league_map alm ON tr.article_id = alm.article_id AND alm.league_id = l.id
  WHERE si.is_olympics = false AND si.league_id IS NOT NULL;

  -- Olympics general
  INSERT INTO temp_matched (article_id, label)
  SELECT tr.article_id, 'Olympics'
  FROM temp_result_articles tr
  JOIN articles a ON tr.article_id = a.id AND a.is_olympics = true
  JOIN subscriber_interests si ON si.is_olympics = true AND si.subscriber_id = p_subscriber_id
    AND si.sport_id IS NULL AND si.country_id IS NULL;

  -- Olympics + sport
  INSERT INTO temp_matched (article_id, label)
  SELECT tr.article_id, 'Olympics - ' || COALESCE(sp.display_label, sp.sport)
  FROM temp_result_articles tr
  JOIN articles a ON tr.article_id = a.id AND a.is_olympics = true
  JOIN article_sport_map asm ON tr.article_id = asm.article_id
  JOIN sports sp ON asm.sport_id = sp.id
  JOIN subscriber_interests si ON si.sport_id = sp.id AND si.subscriber_id = p_subscriber_id
    AND si.is_olympics = true AND si.country_id IS NULL;

  -- Olympics + country
  INSERT INTO temp_matched (article_id, label)
  SELECT tr.article_id, 'Olympics - ' || c.name
  FROM temp_result_articles tr
  JOIN articles a ON tr.article_id = a.id AND a.is_olympics = true
  JOIN article_country_map acm ON tr.article_id = acm.article_id
  JOIN countries c ON acm.country_id = c.id
  JOIN subscriber_interests si ON si.country_id = c.id AND si.subscriber_id = p_subscriber_id
    AND si.is_olympics = true AND si.sport_id IS NULL;

  -- Olympics + sport + country
  INSERT INTO temp_matched (article_id, label)
  SELECT tr.article_id, 'Olympics - ' || COALESCE(sp.display_label, sp.sport) || ' - ' || c.name
  FROM temp_result_articles tr
  JOIN articles a ON tr.article_id = a.id AND a.is_olympics = true
  JOIN article_sport_map asm ON tr.article_id = asm.article_id
  JOIN article_country_map acm ON tr.article_id = acm.article_id
  JOIN sports sp ON asm.sport_id = sp.id
  JOIN countries c ON acm.country_id = c.id
  JOIN subscriber_interests si ON si.sport_id = sp.id AND acm.country_id = si.country_id
    AND si.subscriber_id = p_subscriber_id AND si.is_olympics = true;

  -- Return results
  RETURN QUERY
  SELECT
    a.id::integer,
    a.title,
    a.url,
    a.excerpt,
    a.lead_image_url,
    a.published_at,
    a.source_display_name,
    a.domain,
    a.media_type::text,
    a.media_url,
    COALESCE(mi.labels, ARRAY[]::text[]) as matched_interests
  FROM temp_result_articles tr
  JOIN articles a ON tr.article_id = a.id
  LEFT JOIN (
    SELECT tm.article_id, array_agg(DISTINCT tm.label) as labels
    FROM temp_matched tm
    GROUP BY tm.article_id
  ) mi ON tr.article_id = mi.article_id
  ORDER BY a.published_at DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
