-- Replace get_subscriber_feed with a performant combined-feed matcher (UNION-based)
DROP FUNCTION IF EXISTS public.get_subscriber_feed(uuid, int, timestamptz, int, int, text, int, int);

CREATE OR REPLACE FUNCTION public.get_subscriber_feed(
  p_subscriber_id uuid,
  p_limit int DEFAULT 100,
  p_cursor_time timestamptz DEFAULT NULL,
  p_cursor_id int DEFAULT NULL,
  p_interest_id int DEFAULT NULL,
  p_entity_type text DEFAULT NULL,
  p_entity_id int DEFAULT NULL,
  p_focus_league_id int DEFAULT NULL
)
RETURNS TABLE (
  article_id int,
  title text,
  url text,
  thumbnail_url text,
  domain text,
  url_domain text,
  published_effective timestamptz,
  published_at timestamptz,
  updated_at timestamptz,
  matched_interests text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_focus boolean;
BEGIN
  CREATE TEMP TABLE IF NOT EXISTS temp_feed_articles (
    article_id int PRIMARY KEY
  ) ON COMMIT DROP;

  TRUNCATE temp_feed_articles;

  -- CASE 1: Entity-based focus
  IF p_entity_type IS NOT NULL AND p_entity_id IS NOT NULL THEN
    IF p_entity_type = 'team' THEN
      INSERT INTO temp_feed_articles
      SELECT DISTINCT atm.article_id FROM article_team_map atm WHERE atm.team_id = p_entity_id;
    ELSIF p_entity_type = 'person' THEN
      INSERT INTO temp_feed_articles
      SELECT DISTINCT apm.article_id FROM article_person_map apm WHERE apm.person_id = p_entity_id;
    ELSIF p_entity_type = 'league' THEN
      INSERT INTO temp_feed_articles
      SELECT DISTINCT alm.article_id FROM article_league_map alm WHERE alm.league_id = p_entity_id;
    ELSIF p_entity_type = 'sport' THEN
      INSERT INTO temp_feed_articles
      SELECT DISTINCT asm.article_id FROM article_sport_map asm WHERE asm.sport_id = ANY(get_sport_with_children(p_entity_id));
    ELSIF p_entity_type = 'school' THEN
      IF p_focus_league_id IS NOT NULL THEN
        INSERT INTO temp_feed_articles
        SELECT DISTINCT a.id
        FROM article_school_map aschm
        JOIN articles a ON a.id = aschm.article_id
        WHERE aschm.school_id = p_entity_id
          AND EXISTS (
            SELECT 1 FROM article_league_map alm
            WHERE alm.article_id = a.id AND alm.league_id = p_focus_league_id
          );
      ELSE
        INSERT INTO temp_feed_articles
        SELECT DISTINCT aschm.article_id FROM article_school_map aschm WHERE aschm.school_id = p_entity_id;
      END IF;
    ELSIF p_entity_type = 'country' THEN
      IF p_focus_league_id IS NOT NULL THEN
        INSERT INTO temp_feed_articles
        SELECT DISTINCT a.id
        FROM article_country_map acm
        JOIN articles a ON a.id = acm.article_id
        WHERE acm.country_id = p_entity_id
          AND EXISTS (
            SELECT 1 FROM article_league_map alm
            WHERE alm.article_id = a.id AND alm.league_id = p_focus_league_id
          );
      ELSE
        INSERT INTO temp_feed_articles
        SELECT DISTINCT acm.article_id FROM article_country_map acm WHERE acm.country_id = p_entity_id;
      END IF;
    END IF;

    RETURN QUERY
    SELECT
      a.id AS article_id, a.title, a.url, a.thumbnail_url, a.domain, a.url_domain,
      COALESCE(a.published_at, a.updated_at, a.created_at) AS published_effective,
      a.published_at, a.updated_at,
      NULL::text[] AS matched_interests
    FROM articles a
    JOIN temp_feed_articles tfa ON tfa.article_id = a.id
    WHERE a.is_duplicate = false
      AND (
        p_cursor_time IS NULL
        OR COALESCE(a.published_at, a.updated_at, a.created_at) < p_cursor_time
        OR (
          COALESCE(a.published_at, a.updated_at, a.created_at) = p_cursor_time
          AND a.id < p_cursor_id
        )
      )
    ORDER BY COALESCE(a.published_at, a.updated_at, a.created_at) DESC, a.id DESC
    LIMIT LEAST(p_limit, 200);
    RETURN;
  END IF;

  -- CASE 2: Interest-based focus
  IF p_interest_id IS NOT NULL THEN
    INSERT INTO temp_feed_articles
    WITH i AS (
      SELECT *
      FROM subscriber_interests
      WHERE id = p_interest_id
        AND subscriber_id = p_subscriber_id
    )
    SELECT DISTINCT x.article_id
    FROM (
      SELECT atm.article_id
      FROM i
      JOIN article_team_map atm ON i.team_id IS NOT NULL AND atm.team_id = i.team_id

      UNION
      SELECT apm.article_id
      FROM i
      JOIN article_person_map apm ON i.person_id IS NOT NULL AND apm.person_id = i.person_id

      UNION
      SELECT alm.article_id
      FROM i
      JOIN article_league_map alm ON i.league_id IS NOT NULL
        AND i.team_id IS NULL AND i.school_id IS NULL AND i.country_id IS NULL
        AND COALESCE(i.is_olympics,false) = false
        AND alm.league_id = i.league_id

      UNION
      SELECT asm.article_id
      FROM i
      JOIN article_sport_map asm ON i.sport_id IS NOT NULL
        AND i.league_id IS NULL AND i.team_id IS NULL AND i.school_id IS NULL AND i.country_id IS NULL
        AND COALESCE(i.is_olympics,false) = false
        AND asm.sport_id = ANY(get_sport_with_children(i.sport_id))

      UNION
      SELECT aschm.article_id
      FROM i
      JOIN article_school_map aschm ON i.school_id IS NOT NULL AND i.league_id IS NULL AND aschm.school_id = i.school_id

      UNION
      SELECT a.id
      FROM i
      JOIN article_school_map aschm ON i.school_id IS NOT NULL AND i.league_id IS NOT NULL AND aschm.school_id = i.school_id
      JOIN articles a ON a.id = aschm.article_id
      WHERE COALESCE(i.is_olympics,false) = false
        AND EXISTS (SELECT 1 FROM article_league_map alm WHERE alm.article_id = a.id AND alm.league_id = i.league_id)

      UNION
      SELECT acm.article_id
      FROM i
      JOIN article_country_map acm ON i.country_id IS NOT NULL AND i.league_id IS NULL AND acm.country_id = i.country_id
      WHERE COALESCE(i.is_olympics,false) = false

      UNION
      SELECT a.id
      FROM i
      JOIN article_country_map acm ON i.country_id IS NOT NULL AND i.league_id IS NOT NULL AND acm.country_id = i.country_id
      JOIN articles a ON a.id = acm.article_id
      WHERE COALESCE(i.is_olympics,false) = false
        AND EXISTS (SELECT 1 FROM article_league_map alm WHERE alm.article_id = a.id AND alm.league_id = i.league_id)

      UNION
      SELECT a.id
      FROM i
      JOIN articles a ON a.is_olympics = true
      WHERE i.is_olympics = true
        AND (i.sport_id IS NULL OR EXISTS (SELECT 1 FROM article_sport_map asm WHERE asm.article_id = a.id AND asm.sport_id = ANY(get_sport_with_children(i.sport_id))))
        AND (i.country_id IS NULL OR EXISTS (SELECT 1 FROM article_country_map acm WHERE acm.article_id = a.id AND acm.country_id = i.country_id))
    ) x;

    RETURN QUERY
    SELECT
      a.id AS article_id, a.title, a.url, a.thumbnail_url, a.domain, a.url_domain,
      COALESCE(a.published_at, a.updated_at, a.created_at) AS published_effective,
      a.published_at, a.updated_at,
      NULL::text[] AS matched_interests
    FROM articles a
    JOIN temp_feed_articles tfa ON tfa.article_id = a.id
    WHERE a.is_duplicate = false
      AND (
        p_cursor_time IS NULL
        OR COALESCE(a.published_at, a.updated_at, a.created_at) < p_cursor_time
        OR (
          COALESCE(a.published_at, a.updated_at, a.created_at) = p_cursor_time
          AND a.id < p_cursor_id
        )
      )
    ORDER BY COALESCE(a.published_at, a.updated_at, a.created_at) DESC, a.id DESC
    LIMIT LEAST(p_limit, 200);
    RETURN;
  END IF;

  -- CASE 3: Combined feed
  SELECT EXISTS(
    SELECT 1 FROM subscriber_interests
    WHERE subscriber_id = p_subscriber_id AND is_focused = true
  ) INTO v_has_focus;

  -- Build matching article ids via UNIONs (fast)
  INSERT INTO temp_feed_articles
  WITH prefs AS (
    SELECT *
    FROM subscriber_interests
    WHERE subscriber_id = p_subscriber_id
      AND (NOT v_has_focus OR is_focused = true)
  )
  SELECT DISTINCT x.article_id
  FROM (
    -- Teams
    SELECT atm.article_id
    FROM prefs p
    JOIN article_team_map atm ON p.team_id IS NOT NULL AND atm.team_id = p.team_id
    WHERE COALESCE(p.is_olympics,false) = false

    UNION
    -- People
    SELECT apm.article_id
    FROM prefs p
    JOIN article_person_map apm ON p.person_id IS NOT NULL AND apm.person_id = p.person_id
    WHERE COALESCE(p.is_olympics,false) = false

    UNION
    -- Standalone leagues
    SELECT alm.article_id
    FROM prefs p
    JOIN article_league_map alm ON p.league_id IS NOT NULL
      AND p.team_id IS NULL AND p.school_id IS NULL AND p.country_id IS NULL
      AND COALESCE(p.is_olympics,false) = false
      AND alm.league_id = p.league_id

    UNION
    -- Standalone sports (with child expansion)
    SELECT asm.article_id
    FROM prefs p
    JOIN article_sport_map asm ON p.sport_id IS NOT NULL
      AND p.league_id IS NULL AND p.team_id IS NULL AND p.school_id IS NULL AND p.country_id IS NULL
      AND COALESCE(p.is_olympics,false) = false
      AND asm.sport_id = ANY(get_sport_with_children(p.sport_id))

    UNION
    -- School (All)
    SELECT aschm.article_id
    FROM prefs p
    JOIN article_school_map aschm ON p.school_id IS NOT NULL AND p.league_id IS NULL AND aschm.school_id = p.school_id
    WHERE COALESCE(p.is_olympics,false) = false

    UNION
    -- School + league intersection
    SELECT a.id
    FROM prefs p
    JOIN article_school_map aschm ON p.school_id IS NOT NULL AND p.league_id IS NOT NULL AND aschm.school_id = p.school_id
    JOIN articles a ON a.id = aschm.article_id
    WHERE COALESCE(p.is_olympics,false) = false
      AND EXISTS (SELECT 1 FROM article_league_map alm WHERE alm.article_id = a.id AND alm.league_id = p.league_id)

    UNION
    -- Country (non-Olympics) no league
    SELECT acm.article_id
    FROM prefs p
    JOIN article_country_map acm ON p.country_id IS NOT NULL AND p.league_id IS NULL AND acm.country_id = p.country_id
    WHERE COALESCE(p.is_olympics,false) = false

    UNION
    -- Country + league (non-Olympics)
    SELECT a.id
    FROM prefs p
    JOIN article_country_map acm ON p.country_id IS NOT NULL AND p.league_id IS NOT NULL AND acm.country_id = p.country_id
    JOIN articles a ON a.id = acm.article_id
    WHERE COALESCE(p.is_olympics,false) = false
      AND EXISTS (SELECT 1 FROM article_league_map alm WHERE alm.article_id = a.id AND alm.league_id = p.league_id)

    UNION
    -- Olympics
    SELECT a.id
    FROM prefs p
    JOIN articles a ON a.is_olympics = true
    WHERE p.is_olympics = true
      AND (p.sport_id IS NULL OR EXISTS (SELECT 1 FROM article_sport_map asm WHERE asm.article_id = a.id AND asm.sport_id = ANY(get_sport_with_children(p.sport_id))))
      AND (p.country_id IS NULL OR EXISTS (SELECT 1 FROM article_country_map acm WHERE acm.article_id = a.id AND acm.country_id = p.country_id))
  ) x;

  -- Limit to page + cursor
  CREATE TEMP TABLE IF NOT EXISTS temp_result_articles (
    article_id int PRIMARY KEY
  ) ON COMMIT DROP;
  TRUNCATE temp_result_articles;

  INSERT INTO temp_result_articles
  SELECT a.id
  FROM articles a
  JOIN temp_feed_articles tfa ON tfa.article_id = a.id
  WHERE a.is_duplicate = false
    AND (
      p_cursor_time IS NULL
      OR COALESCE(a.published_at, a.updated_at, a.created_at) < p_cursor_time
      OR (
        COALESCE(a.published_at, a.updated_at, a.created_at) = p_cursor_time
        AND a.id < p_cursor_id
      )
    )
  ORDER BY COALESCE(a.published_at, a.updated_at, a.created_at) DESC, a.id DESC
  LIMIT LEAST(p_limit, 200);

  -- Batch compute matched labels for the limited set
  CREATE TEMP TABLE IF NOT EXISTS temp_matched (
    article_id int,
    label text
  ) ON COMMIT DROP;
  TRUNCATE temp_matched;

  -- Teams
  INSERT INTO temp_matched
  SELECT atm.article_id, t.display_name
  FROM temp_result_articles tra
  JOIN article_team_map atm ON atm.article_id = tra.article_id
  JOIN subscriber_interests si ON si.subscriber_id = p_subscriber_id AND (NOT v_has_focus OR si.is_focused = true) AND si.team_id = atm.team_id
  JOIN teams t ON t.id = si.team_id;

  -- People
  INSERT INTO temp_matched
  SELECT apm.article_id, pe.name
  FROM temp_result_articles tra
  JOIN article_person_map apm ON apm.article_id = tra.article_id
  JOIN subscriber_interests si ON si.subscriber_id = p_subscriber_id AND (NOT v_has_focus OR si.is_focused = true) AND si.person_id = apm.person_id
  JOIN people pe ON pe.id = si.person_id;

  -- Standalone leagues
  INSERT INTO temp_matched
  SELECT alm.article_id, l.code
  FROM temp_result_articles tra
  JOIN article_league_map alm ON alm.article_id = tra.article_id
  JOIN subscriber_interests si ON si.subscriber_id = p_subscriber_id AND (NOT v_has_focus OR si.is_focused = true)
    AND si.league_id = alm.league_id
    AND si.team_id IS NULL AND si.school_id IS NULL AND si.country_id IS NULL
    AND COALESCE(si.is_olympics,false) = false
  JOIN leagues l ON l.id = si.league_id;

  -- Standalone sports (parents include children)
  INSERT INTO temp_matched
  SELECT asm.article_id, COALESCE(sp.display_label, sp.sport)
  FROM temp_result_articles tra
  JOIN article_sport_map asm ON asm.article_id = tra.article_id
  JOIN subscriber_interests si ON si.subscriber_id = p_subscriber_id AND (NOT v_has_focus OR si.is_focused = true)
    AND si.sport_id IS NOT NULL
    AND si.league_id IS NULL AND si.team_id IS NULL AND si.school_id IS NULL AND si.country_id IS NULL
    AND COALESCE(si.is_olympics,false) = false
    AND asm.sport_id = ANY(get_sport_with_children(si.sport_id))
  JOIN sports sp ON sp.id = si.sport_id;

  -- Schools with league
  INSERT INTO temp_matched
  SELECT aschm.article_id, sch.short_name || ' (' || l.code || ')'
  FROM temp_result_articles tra
  JOIN article_school_map aschm ON aschm.article_id = tra.article_id
  JOIN subscriber_interests si ON si.subscriber_id = p_subscriber_id AND (NOT v_has_focus OR si.is_focused = true)
    AND si.school_id = aschm.school_id AND si.league_id IS NOT NULL
    AND COALESCE(si.is_olympics,false) = false
  JOIN article_league_map alm ON alm.article_id = tra.article_id AND alm.league_id = si.league_id
  JOIN schools sch ON sch.id = si.school_id
  JOIN leagues l ON l.id = si.league_id;

  -- Schools (All)
  INSERT INTO temp_matched
  SELECT aschm.article_id, sch.short_name || ' (All)'
  FROM temp_result_articles tra
  JOIN article_school_map aschm ON aschm.article_id = tra.article_id
  JOIN subscriber_interests si ON si.subscriber_id = p_subscriber_id AND (NOT v_has_focus OR si.is_focused = true)
    AND si.school_id = aschm.school_id AND si.league_id IS NULL
    AND COALESCE(si.is_olympics,false) = false
  JOIN schools sch ON sch.id = si.school_id;

  -- Countries with league (non-Olympics)
  INSERT INTO temp_matched
  SELECT acm.article_id, c.name || ' (' || l.code || ')'
  FROM temp_result_articles tra
  JOIN article_country_map acm ON acm.article_id = tra.article_id
  JOIN subscriber_interests si ON si.subscriber_id = p_subscriber_id AND (NOT v_has_focus OR si.is_focused = true)
    AND si.country_id = acm.country_id AND si.league_id IS NOT NULL
    AND COALESCE(si.is_olympics,false) = false
  JOIN article_league_map alm ON alm.article_id = tra.article_id AND alm.league_id = si.league_id
  JOIN countries c ON c.id = si.country_id
  JOIN leagues l ON l.id = si.league_id;

  -- Olympics variants
  INSERT INTO temp_matched
  SELECT tra.article_id, 'Olympics'
  FROM temp_result_articles tra
  JOIN articles a ON a.id = tra.article_id AND a.is_olympics = true
  JOIN subscriber_interests si ON si.subscriber_id = p_subscriber_id AND (NOT v_has_focus OR si.is_focused = true)
    AND si.is_olympics = true AND si.sport_id IS NULL AND si.country_id IS NULL;

  INSERT INTO temp_matched
  SELECT tra.article_id, 'Olympics (' || COALESCE(sp.display_label, sp.sport) || ')'
  FROM temp_result_articles tra
  JOIN articles a ON a.id = tra.article_id AND a.is_olympics = true
  JOIN subscriber_interests si ON si.subscriber_id = p_subscriber_id AND (NOT v_has_focus OR si.is_focused = true)
    AND si.is_olympics = true AND si.sport_id IS NOT NULL AND si.country_id IS NULL
  JOIN sports sp ON sp.id = si.sport_id
  WHERE EXISTS (SELECT 1 FROM article_sport_map asm WHERE asm.article_id = tra.article_id AND asm.sport_id = ANY(get_sport_with_children(si.sport_id)));

  INSERT INTO temp_matched
  SELECT tra.article_id, 'Olympics (' || c.name || ')'
  FROM temp_result_articles tra
  JOIN articles a ON a.id = tra.article_id AND a.is_olympics = true
  JOIN subscriber_interests si ON si.subscriber_id = p_subscriber_id AND (NOT v_has_focus OR si.is_focused = true)
    AND si.is_olympics = true AND si.sport_id IS NULL AND si.country_id IS NOT NULL
  JOIN countries c ON c.id = si.country_id
  WHERE EXISTS (SELECT 1 FROM article_country_map acm WHERE acm.article_id = tra.article_id AND acm.country_id = si.country_id);

  INSERT INTO temp_matched
  SELECT tra.article_id, 'Olympics (' || COALESCE(sp.display_label, sp.sport) || ', ' || c.name || ')'
  FROM temp_result_articles tra
  JOIN articles a ON a.id = tra.article_id AND a.is_olympics = true
  JOIN subscriber_interests si ON si.subscriber_id = p_subscriber_id AND (NOT v_has_focus OR si.is_focused = true)
    AND si.is_olympics = true AND si.sport_id IS NOT NULL AND si.country_id IS NOT NULL
  JOIN sports sp ON sp.id = si.sport_id
  JOIN countries c ON c.id = si.country_id
  WHERE EXISTS (SELECT 1 FROM article_sport_map asm WHERE asm.article_id = tra.article_id AND asm.sport_id = ANY(get_sport_with_children(si.sport_id)))
    AND EXISTS (SELECT 1 FROM article_country_map acm WHERE acm.article_id = tra.article_id AND acm.country_id = si.country_id);

  RETURN QUERY
  SELECT
    a.id AS article_id, a.title, a.url, a.thumbnail_url, a.domain, a.url_domain,
    COALESCE(a.published_at, a.updated_at, a.created_at) AS published_effective,
    a.published_at, a.updated_at,
    (SELECT array_agg(DISTINCT tm.label ORDER BY tm.label) FROM temp_matched tm WHERE tm.article_id = a.id) AS matched_interests
  FROM articles a
  JOIN temp_result_articles tra ON tra.article_id = a.id
  ORDER BY COALESCE(a.published_at, a.updated_at, a.created_at) DESC, a.id DESC;
END;
$$;