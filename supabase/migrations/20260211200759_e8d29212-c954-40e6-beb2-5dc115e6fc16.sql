
CREATE OR REPLACE FUNCTION public.get_subscriber_feed(
  p_subscriber_id uuid,
  p_limit integer DEFAULT 100,
  p_cursor_id integer DEFAULT NULL,
  p_cursor_time timestamptz DEFAULT NULL,
  p_interest_id integer DEFAULT NULL,
  p_entity_type text DEFAULT NULL,
  p_entity_id integer DEFAULT NULL,
  p_focus_league_id integer DEFAULT NULL
)
RETURNS TABLE (
  article_id integer,
  title text,
  url text,
  thumbnail_url text,
  published_effective timestamptz,
  domain text,
  url_domain text,
  matched_interests text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_focus boolean := false;
BEGIN
  CREATE TEMP TABLE IF NOT EXISTS temp_feed_articles (article_id integer PRIMARY KEY) ON COMMIT DROP;
  CREATE TEMP TABLE IF NOT EXISTS temp_result_articles (
    article_id integer PRIMARY KEY,
    title text,
    url text,
    thumbnail_url text,
    published_effective timestamptz,
    domain text,
    url_domain text
  ) ON COMMIT DROP;
  CREATE TEMP TABLE IF NOT EXISTS temp_matched (
    article_id integer,
    label text
  ) ON COMMIT DROP;

  TRUNCATE temp_feed_articles;
  TRUNCATE temp_result_articles;
  TRUNCATE temp_matched;

  -- CASE: Direct entity focus
  IF p_entity_type IS NOT NULL AND p_entity_id IS NOT NULL THEN
    IF p_entity_type = 'team' THEN
      INSERT INTO temp_feed_articles SELECT DISTINCT atm.article_id::integer FROM article_team_map atm WHERE atm.team_id = p_entity_id;
    ELSIF p_entity_type = 'person' THEN
      INSERT INTO temp_feed_articles SELECT DISTINCT apm.article_id::integer FROM article_person_map apm WHERE apm.person_id = p_entity_id;
    ELSIF p_entity_type = 'league' THEN
      INSERT INTO temp_feed_articles SELECT DISTINCT alm.article_id::integer FROM article_league_map alm WHERE alm.league_id = p_entity_id;
    ELSIF p_entity_type = 'sport' THEN
      INSERT INTO temp_feed_articles SELECT DISTINCT asm.article_id::integer FROM article_sport_map asm WHERE asm.sport_id = p_entity_id;
    ELSIF p_entity_type = 'school' THEN
      IF p_focus_league_id IS NOT NULL THEN
        INSERT INTO temp_feed_articles
        SELECT DISTINCT aschm.article_id::integer FROM article_school_map aschm
        JOIN article_league_map alm ON aschm.article_id = alm.article_id AND alm.league_id = p_focus_league_id
        WHERE aschm.school_id = p_entity_id;
      ELSE
        INSERT INTO temp_feed_articles SELECT DISTINCT aschm.article_id::integer FROM article_school_map aschm WHERE aschm.school_id = p_entity_id;
      END IF;
    ELSIF p_entity_type = 'country' THEN
      IF p_focus_league_id IS NOT NULL THEN
        INSERT INTO temp_feed_articles
        SELECT DISTINCT acm.article_id::integer FROM article_country_map acm
        JOIN article_league_map alm ON acm.article_id = alm.article_id AND alm.league_id = p_focus_league_id
        WHERE acm.country_id = p_entity_id;
      ELSE
        INSERT INTO temp_feed_articles SELECT DISTINCT acm.article_id::integer FROM article_country_map acm WHERE acm.country_id = p_entity_id;
      END IF;
    END IF;

  ELSIF p_interest_id IS NOT NULL THEN
    INSERT INTO temp_feed_articles
    SELECT DISTINCT x.article_id::integer
    FROM (
      SELECT atm.article_id FROM subscriber_interests si
        JOIN article_team_map atm ON si.team_id = atm.team_id
        WHERE si.id = p_interest_id AND si.subscriber_id = p_subscriber_id
      UNION
      SELECT apm.article_id FROM subscriber_interests si
        JOIN article_person_map apm ON si.person_id = apm.person_id
        WHERE si.id = p_interest_id AND si.subscriber_id = p_subscriber_id
      UNION
      SELECT alm.article_id FROM subscriber_interests si
        JOIN article_league_map alm ON si.league_id = alm.league_id
        WHERE si.id = p_interest_id AND si.subscriber_id = p_subscriber_id
        AND si.school_id IS NULL AND si.country_id IS NULL
      UNION
      SELECT asm.article_id FROM subscriber_interests si
        JOIN article_sport_map asm ON si.sport_id = asm.sport_id
        WHERE si.id = p_interest_id AND si.subscriber_id = p_subscriber_id
        AND si.league_id IS NULL AND si.is_olympics = false
      UNION
      SELECT aschm.article_id FROM subscriber_interests si
        JOIN article_school_map aschm ON si.school_id = aschm.school_id
        JOIN article_league_map alm2 ON aschm.article_id = alm2.article_id AND si.league_id = alm2.league_id
        WHERE si.id = p_interest_id AND si.subscriber_id = p_subscriber_id
        AND si.school_id IS NOT NULL AND si.league_id IS NOT NULL
      UNION
      SELECT aschm.article_id FROM subscriber_interests si
        JOIN article_school_map aschm ON si.school_id = aschm.school_id
        WHERE si.id = p_interest_id AND si.subscriber_id = p_subscriber_id
        AND si.school_id IS NOT NULL AND si.league_id IS NULL
      UNION
      SELECT acm.article_id FROM subscriber_interests si
        JOIN article_country_map acm ON si.country_id = acm.country_id
        JOIN article_league_map alm3 ON acm.article_id = alm3.article_id AND si.league_id = alm3.league_id
        WHERE si.id = p_interest_id AND si.subscriber_id = p_subscriber_id
        AND si.country_id IS NOT NULL AND si.league_id IS NOT NULL AND si.is_olympics = false
      UNION
      SELECT a.id FROM subscriber_interests si
        JOIN articles a ON a.is_olympics = true
        WHERE si.id = p_interest_id AND si.subscriber_id = p_subscriber_id AND si.is_olympics = true
        AND si.sport_id IS NULL AND si.country_id IS NULL
      UNION
      SELECT a.id FROM subscriber_interests si
        JOIN articles a ON a.is_olympics = true
        JOIN article_sport_map asm2 ON a.id = asm2.article_id AND si.sport_id = asm2.sport_id
        WHERE si.id = p_interest_id AND si.subscriber_id = p_subscriber_id AND si.is_olympics = true
        AND si.sport_id IS NOT NULL AND si.country_id IS NULL
      UNION
      SELECT a.id FROM subscriber_interests si
        JOIN articles a ON a.is_olympics = true
        JOIN article_country_map acm2 ON a.id = acm2.article_id AND si.country_id = acm2.country_id
        WHERE si.id = p_interest_id AND si.subscriber_id = p_subscriber_id AND si.is_olympics = true
        AND si.sport_id IS NULL AND si.country_id IS NOT NULL
      UNION
      SELECT a.id FROM subscriber_interests si
        JOIN articles a ON a.is_olympics = true
        JOIN article_sport_map asm3 ON a.id = asm3.article_id AND si.sport_id = asm3.sport_id
        JOIN article_country_map acm3 ON a.id = acm3.article_id AND si.country_id = acm3.country_id
        WHERE si.id = p_interest_id AND si.subscriber_id = p_subscriber_id AND si.is_olympics = true
        AND si.sport_id IS NOT NULL AND si.country_id IS NOT NULL
    ) x;

  ELSE
    -- Combined feed
    SELECT EXISTS(SELECT 1 FROM subscriber_interests WHERE subscriber_id = p_subscriber_id AND is_focused = true) INTO v_has_focus;

    INSERT INTO temp_feed_articles
    SELECT DISTINCT x.article_id::integer
    FROM (
      SELECT atm.article_id FROM subscriber_interests si
        JOIN article_team_map atm ON si.team_id = atm.team_id
        WHERE si.subscriber_id = p_subscriber_id AND (NOT v_has_focus OR si.is_focused = true)
      UNION
      SELECT apm.article_id FROM subscriber_interests si
        JOIN article_person_map apm ON si.person_id = apm.person_id
        WHERE si.subscriber_id = p_subscriber_id AND (NOT v_has_focus OR si.is_focused = true)
      UNION
      SELECT alm.article_id FROM subscriber_interests si
        JOIN article_league_map alm ON si.league_id = alm.league_id
        WHERE si.subscriber_id = p_subscriber_id AND (NOT v_has_focus OR si.is_focused = true)
        AND si.school_id IS NULL AND si.country_id IS NULL
      UNION
      SELECT asm.article_id FROM subscriber_interests si
        JOIN article_sport_map asm ON si.sport_id = asm.sport_id
        WHERE si.subscriber_id = p_subscriber_id AND (NOT v_has_focus OR si.is_focused = true)
        AND si.league_id IS NULL AND si.is_olympics = false
      UNION
      SELECT aschm.article_id FROM subscriber_interests si
        JOIN article_school_map aschm ON si.school_id = aschm.school_id
        JOIN article_league_map alm2 ON aschm.article_id = alm2.article_id AND si.league_id = alm2.league_id
        WHERE si.subscriber_id = p_subscriber_id AND (NOT v_has_focus OR si.is_focused = true)
        AND si.school_id IS NOT NULL AND si.league_id IS NOT NULL
      UNION
      SELECT aschm.article_id FROM subscriber_interests si
        JOIN article_school_map aschm ON si.school_id = aschm.school_id
        WHERE si.subscriber_id = p_subscriber_id AND (NOT v_has_focus OR si.is_focused = true)
        AND si.school_id IS NOT NULL AND si.league_id IS NULL
      UNION
      SELECT acm.article_id FROM subscriber_interests si
        JOIN article_country_map acm ON si.country_id = acm.country_id
        JOIN article_league_map alm3 ON acm.article_id = alm3.article_id AND si.league_id = alm3.league_id
        WHERE si.subscriber_id = p_subscriber_id AND (NOT v_has_focus OR si.is_focused = true)
        AND si.country_id IS NOT NULL AND si.league_id IS NOT NULL AND si.is_olympics = false
      UNION
      SELECT a.id FROM subscriber_interests si
        JOIN articles a ON a.is_olympics = true
        WHERE si.subscriber_id = p_subscriber_id AND (NOT v_has_focus OR si.is_focused = true)
        AND si.is_olympics = true AND si.sport_id IS NULL AND si.country_id IS NULL
      UNION
      SELECT a.id FROM subscriber_interests si
        JOIN articles a ON a.is_olympics = true
        JOIN article_sport_map asm2 ON a.id = asm2.article_id AND si.sport_id = asm2.sport_id
        WHERE si.subscriber_id = p_subscriber_id AND (NOT v_has_focus OR si.is_focused = true)
        AND si.is_olympics = true AND si.sport_id IS NOT NULL AND si.country_id IS NULL
      UNION
      SELECT a.id FROM subscriber_interests si
        JOIN articles a ON a.is_olympics = true
        JOIN article_country_map acm2 ON a.id = acm2.article_id AND si.country_id = acm2.country_id
        WHERE si.subscriber_id = p_subscriber_id AND (NOT v_has_focus OR si.is_focused = true)
        AND si.is_olympics = true AND si.sport_id IS NULL AND si.country_id IS NOT NULL
      UNION
      SELECT a.id FROM subscriber_interests si
        JOIN articles a ON a.is_olympics = true
        JOIN article_sport_map asm3 ON a.id = asm3.article_id AND si.sport_id = asm3.sport_id
        JOIN article_country_map acm3 ON a.id = acm3.article_id AND si.country_id = acm3.country_id
        WHERE si.subscriber_id = p_subscriber_id AND (NOT v_has_focus OR si.is_focused = true)
        AND si.is_olympics = true AND si.sport_id IS NOT NULL AND si.country_id IS NOT NULL
    ) x;
  END IF;

  -- Paginated results
  INSERT INTO temp_result_articles
  SELECT 
    a.id::integer,
    a.title,
    a.url,
    a.thumbnail_url,
    COALESCE(a.published_at, a.first_seen_at, a.created_at),
    a.domain,
    a.url_domain
  FROM articles a
  JOIN temp_feed_articles tf ON a.id = tf.article_id
  WHERE a.is_duplicate = false
    AND (p_cursor_time IS NULL OR 
         COALESCE(a.published_at, a.first_seen_at, a.created_at) < p_cursor_time OR
         (COALESCE(a.published_at, a.first_seen_at, a.created_at) = p_cursor_time AND a.id < p_cursor_id))
  ORDER BY COALESCE(a.published_at, a.first_seen_at, a.created_at) DESC, a.id DESC
  LIMIT p_limit;

  -- =============================================
  -- Badge generation for DIRECT ENTITY FOCUS
  -- (no subscriber_interests needed)
  -- =============================================
  IF p_entity_type IS NOT NULL AND p_entity_id IS NOT NULL THEN
    IF p_entity_type = 'team' THEN
      INSERT INTO temp_matched (article_id, label)
      SELECT tr.article_id, COALESCE(t.nickname, t.display_name)
      FROM temp_result_articles tr
      JOIN article_team_map atm ON tr.article_id = atm.article_id
      JOIN teams t ON atm.team_id = t.id
      WHERE t.id = p_entity_id;
    ELSIF p_entity_type = 'person' THEN
      INSERT INTO temp_matched (article_id, label)
      SELECT tr.article_id, p.name
      FROM temp_result_articles tr
      JOIN article_person_map apm ON tr.article_id = apm.article_id
      JOIN people p ON apm.person_id = p.id
      WHERE p.id = p_entity_id;
    ELSIF p_entity_type = 'league' THEN
      INSERT INTO temp_matched (article_id, label)
      SELECT tr.article_id, COALESCE(l.display_label, l.name, l.code)
      FROM temp_result_articles tr
      JOIN article_league_map alm ON tr.article_id = alm.article_id
      JOIN leagues l ON alm.league_id = l.id
      WHERE l.id = p_entity_id;
    ELSIF p_entity_type = 'sport' THEN
      INSERT INTO temp_matched (article_id, label)
      SELECT tr.article_id, COALESCE(sp.display_label, sp.sport)
      FROM temp_result_articles tr
      JOIN article_sport_map asm ON tr.article_id = asm.article_id
      JOIN sports sp ON asm.sport_id = sp.id
      WHERE sp.id = p_entity_id;
    ELSIF p_entity_type = 'school' THEN
      IF p_focus_league_id IS NOT NULL THEN
        INSERT INTO temp_matched (article_id, label)
        SELECT tr.article_id, 'school:' || COALESCE(sc.short_name, sc.name) || ':' || l.code || ':' || COALESCE(l.logo_url, pmi.logo_url, '')
        FROM temp_result_articles tr
        JOIN article_school_map aschm ON tr.article_id = aschm.article_id
        JOIN schools sc ON aschm.school_id = sc.id AND sc.id = p_entity_id
        JOIN leagues l ON l.id = p_focus_league_id
        LEFT JOIN preference_menu_items pmi ON pmi.entity_type = 'league' AND pmi.entity_id = l.id;
      ELSE
        INSERT INTO temp_matched (article_id, label)
        SELECT tr.article_id, 'school:' || COALESCE(sc.short_name, sc.name) || '::'
        FROM temp_result_articles tr
        JOIN article_school_map aschm ON tr.article_id = aschm.article_id
        JOIN schools sc ON aschm.school_id = sc.id AND sc.id = p_entity_id;
      END IF;
    ELSIF p_entity_type = 'country' THEN
      IF p_focus_league_id IS NOT NULL THEN
        INSERT INTO temp_matched (article_id, label)
        SELECT tr.article_id, 'country:' || COALESCE(l.display_label, l.name, l.code) || ':' || COALESCE(c.logo_url, '')
        FROM temp_result_articles tr
        JOIN article_country_map acm ON tr.article_id = acm.article_id
        JOIN countries c ON acm.country_id = c.id AND c.id = p_entity_id
        JOIN leagues l ON l.id = p_focus_league_id;
      ELSE
        INSERT INTO temp_matched (article_id, label)
        SELECT tr.article_id, c.name
        FROM temp_result_articles tr
        JOIN article_country_map acm ON tr.article_id = acm.article_id
        JOIN countries c ON acm.country_id = c.id AND c.id = p_entity_id;
      END IF;
    END IF;
  END IF;

  -- =============================================
  -- Badge generation from SUBSCRIBER INTERESTS
  -- (for interest_id and combined feed)
  -- =============================================
  IF p_entity_type IS NULL THEN
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
    SELECT tr.article_id, COALESCE(l.display_label, l.code)
    FROM temp_result_articles tr
    JOIN article_league_map alm ON tr.article_id = alm.article_id
    JOIN leagues l ON alm.league_id = l.id
    JOIN subscriber_interests si ON si.league_id = l.id AND si.subscriber_id = p_subscriber_id
      AND si.school_id IS NULL AND si.country_id IS NULL;

    -- Sports
    INSERT INTO temp_matched (article_id, label)
    SELECT tr.article_id, COALESCE(sp.display_label, sp.sport)
    FROM temp_result_articles tr
    JOIN article_sport_map asm ON tr.article_id = asm.article_id
    JOIN sports sp ON asm.sport_id = sp.id
    JOIN subscriber_interests si ON si.sport_id = sp.id AND si.subscriber_id = p_subscriber_id
      AND si.league_id IS NULL AND si.is_olympics = false;

    -- Schools WITH league
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

    -- Schools WITHOUT league
    INSERT INTO temp_matched (article_id, label)
    SELECT tr.article_id, 'school:' || COALESCE(sc.short_name, sc.name) || '::'
    FROM temp_result_articles tr
    JOIN article_school_map aschm ON tr.article_id = aschm.article_id
    JOIN schools sc ON aschm.school_id = sc.id
    JOIN subscriber_interests si ON si.school_id = sc.id AND si.subscriber_id = p_subscriber_id
      AND si.league_id IS NULL;

    -- Country + League (non-Olympics)
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

    INSERT INTO temp_matched (article_id, label)
    SELECT tr.article_id, 'Olympics - ' || COALESCE(sp.display_label, sp.sport)
    FROM temp_result_articles tr
    JOIN articles a ON tr.article_id = a.id AND a.is_olympics = true
    JOIN article_sport_map asm ON a.id = asm.article_id
    JOIN sports sp ON asm.sport_id = sp.id
    JOIN subscriber_interests si ON si.sport_id = sp.id AND si.subscriber_id = p_subscriber_id
      AND si.is_olympics = true AND si.country_id IS NULL;

    INSERT INTO temp_matched (article_id, label)
    SELECT tr.article_id, 'Olympics - ' || c.name
    FROM temp_result_articles tr
    JOIN articles a ON tr.article_id = a.id AND a.is_olympics = true
    JOIN article_country_map acm ON a.id = acm.article_id
    JOIN countries c ON acm.country_id = c.id
    JOIN subscriber_interests si ON si.country_id = c.id AND si.subscriber_id = p_subscriber_id
      AND si.is_olympics = true AND si.sport_id IS NULL;

    INSERT INTO temp_matched (article_id, label)
    SELECT tr.article_id, 'Olympics - ' || COALESCE(sp.display_label, sp.sport) || ' - ' || c.name
    FROM temp_result_articles tr
    JOIN articles a ON tr.article_id = a.id AND a.is_olympics = true
    JOIN article_sport_map asm ON a.id = asm.article_id
    JOIN sports sp ON asm.sport_id = sp.id
    JOIN article_country_map acm ON a.id = acm.article_id
    JOIN countries c ON acm.country_id = c.id
    JOIN subscriber_interests si ON si.sport_id = sp.id AND si.country_id = c.id AND si.subscriber_id = p_subscriber_id
      AND si.is_olympics = true;
  END IF;

  -- Return
  RETURN QUERY
  SELECT 
    tr.article_id,
    tr.title,
    tr.url,
    tr.thumbnail_url,
    tr.published_effective,
    tr.domain,
    tr.url_domain,
    COALESCE(array_agg(DISTINCT tm.label) FILTER (WHERE tm.label IS NOT NULL), ARRAY[]::text[])
  FROM temp_result_articles tr
  LEFT JOIN temp_matched tm ON tr.article_id = tm.article_id
  GROUP BY tr.article_id, tr.title, tr.url, tr.thumbnail_url, tr.published_effective, tr.domain, tr.url_domain
  ORDER BY tr.published_effective DESC, tr.article_id DESC;
END;
$$;
