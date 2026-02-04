-- Drop existing function
DROP FUNCTION IF EXISTS public.get_subscriber_feed(uuid, int, timestamptz, int, int, text, int, int);

-- Recreate with optimized matched_interests (batch compute instead of per-row)
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
BEGIN
  -- Build a temp table of matching article IDs based on the focus mode
  CREATE TEMP TABLE IF NOT EXISTS temp_feed_articles (
    article_id int PRIMARY KEY
  ) ON COMMIT DROP;
  
  TRUNCATE temp_feed_articles;

  -- CASE 1: Entity-based focus (type + id, no favorite required)
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
        FROM articles a
        JOIN article_school_map aschm ON aschm.article_id = a.id AND aschm.school_id = p_entity_id
        JOIN article_league_map alm ON alm.article_id = a.id AND alm.league_id = p_focus_league_id;
      ELSE
        INSERT INTO temp_feed_articles
        SELECT DISTINCT aschm.article_id FROM article_school_map aschm WHERE aschm.school_id = p_entity_id;
      END IF;
    ELSIF p_entity_type = 'country' THEN
      IF p_focus_league_id IS NOT NULL THEN
        INSERT INTO temp_feed_articles
        SELECT DISTINCT a.id
        FROM articles a
        JOIN article_country_map acm ON acm.article_id = a.id AND acm.country_id = p_entity_id
        JOIN article_league_map alm ON alm.article_id = a.id AND alm.league_id = p_focus_league_id;
      ELSE
        INSERT INTO temp_feed_articles
        SELECT DISTINCT acm.article_id FROM article_country_map acm WHERE acm.country_id = p_entity_id;
      END IF;
    END IF;

    -- For focused feeds, return without matched_interests (implicit from filter)
    RETURN QUERY
    SELECT
      a.id AS article_id, a.title, a.url, a.thumbnail_url, a.domain, a.url_domain,
      COALESCE(a.published_at, a.created_at) AS published_effective,
      a.published_at, a.updated_at,
      NULL::text[] AS matched_interests
    FROM articles a
    JOIN temp_feed_articles tfa ON tfa.article_id = a.id
    WHERE a.is_duplicate = false
      AND (p_cursor_time IS NULL OR (COALESCE(a.published_at, a.created_at), a.id) < (p_cursor_time, p_cursor_id))
    ORDER BY COALESCE(a.published_at, a.created_at) DESC, a.id DESC
    LIMIT p_limit;
    RETURN;

  -- CASE 2: Interest-based focus (single favorite)
  ELSIF p_interest_id IS NOT NULL THEN
    INSERT INTO temp_feed_articles
    SELECT DISTINCT a.id
    FROM articles a
    JOIN subscriber_interests si ON si.id = p_interest_id AND si.subscriber_id = p_subscriber_id
    LEFT JOIN article_team_map atm ON atm.article_id = a.id AND si.team_id IS NOT NULL AND atm.team_id = si.team_id
    LEFT JOIN article_person_map apm ON apm.article_id = a.id AND si.person_id IS NOT NULL AND apm.person_id = si.person_id
    LEFT JOIN article_league_map alm ON alm.article_id = a.id AND si.league_id IS NOT NULL AND alm.league_id = si.league_id
    LEFT JOIN article_sport_map asm ON asm.article_id = a.id AND si.sport_id IS NOT NULL AND asm.sport_id = ANY(get_sport_with_children(si.sport_id))
    LEFT JOIN article_school_map aschm ON aschm.article_id = a.id AND si.school_id IS NOT NULL AND aschm.school_id = si.school_id
    LEFT JOIN article_country_map acm ON acm.article_id = a.id AND si.country_id IS NOT NULL AND acm.country_id = si.country_id
    WHERE a.is_duplicate = false
      AND (
        (si.team_id IS NOT NULL AND atm.article_id IS NOT NULL)
        OR (si.person_id IS NOT NULL AND apm.article_id IS NOT NULL)
        OR (si.is_olympics = true AND a.is_olympics = true
            AND (si.sport_id IS NULL OR asm.article_id IS NOT NULL)
            AND (si.country_id IS NULL OR acm.article_id IS NOT NULL))
        OR (si.school_id IS NOT NULL AND aschm.article_id IS NOT NULL
            AND (si.league_id IS NULL OR alm.article_id IS NOT NULL))
        OR (si.country_id IS NOT NULL AND si.league_id IS NOT NULL AND acm.article_id IS NOT NULL AND alm.article_id IS NOT NULL AND COALESCE(si.is_olympics, false) = false)
        OR (si.league_id IS NOT NULL AND alm.article_id IS NOT NULL AND si.team_id IS NULL AND si.school_id IS NULL AND si.country_id IS NULL AND COALESCE(si.is_olympics, false) = false)
        OR (si.sport_id IS NOT NULL AND asm.article_id IS NOT NULL AND si.league_id IS NULL AND si.team_id IS NULL AND si.school_id IS NULL AND si.country_id IS NULL AND COALESCE(si.is_olympics, false) = false)
      );

    -- For focused feeds, return without matched_interests
    RETURN QUERY
    SELECT
      a.id AS article_id, a.title, a.url, a.thumbnail_url, a.domain, a.url_domain,
      COALESCE(a.published_at, a.created_at) AS published_effective,
      a.published_at, a.updated_at,
      NULL::text[] AS matched_interests
    FROM articles a
    JOIN temp_feed_articles tfa ON tfa.article_id = a.id
    WHERE a.is_duplicate = false
      AND (p_cursor_time IS NULL OR (COALESCE(a.published_at, a.created_at), a.id) < (p_cursor_time, p_cursor_id))
    ORDER BY COALESCE(a.published_at, a.created_at) DESC, a.id DESC
    LIMIT p_limit;
    RETURN;

  -- CASE 3: Combined feed (all favorites) - compute matched_interests
  ELSE
    INSERT INTO temp_feed_articles
    SELECT DISTINCT a.id
    FROM articles a
    JOIN subscriber_interests si ON si.subscriber_id = p_subscriber_id
    LEFT JOIN article_team_map atm ON atm.article_id = a.id AND si.team_id IS NOT NULL AND atm.team_id = si.team_id
    LEFT JOIN article_person_map apm ON apm.article_id = a.id AND si.person_id IS NOT NULL AND apm.person_id = si.person_id
    LEFT JOIN article_league_map alm ON alm.article_id = a.id AND si.league_id IS NOT NULL AND alm.league_id = si.league_id
    LEFT JOIN article_sport_map asm ON asm.article_id = a.id AND si.sport_id IS NOT NULL AND asm.sport_id = ANY(get_sport_with_children(si.sport_id))
    LEFT JOIN article_school_map aschm ON aschm.article_id = a.id AND si.school_id IS NOT NULL AND aschm.school_id = si.school_id
    LEFT JOIN article_country_map acm ON acm.article_id = a.id AND si.country_id IS NOT NULL AND acm.country_id = si.country_id
    WHERE a.is_duplicate = false
      AND (
        (si.team_id IS NOT NULL AND atm.article_id IS NOT NULL)
        OR (si.person_id IS NOT NULL AND apm.article_id IS NOT NULL)
        OR (si.is_olympics = true AND a.is_olympics = true
            AND (si.sport_id IS NULL OR asm.article_id IS NOT NULL)
            AND (si.country_id IS NULL OR acm.article_id IS NOT NULL))
        OR (si.school_id IS NOT NULL AND aschm.article_id IS NOT NULL
            AND (si.league_id IS NULL OR alm.article_id IS NOT NULL))
        OR (si.country_id IS NOT NULL AND si.league_id IS NOT NULL AND acm.article_id IS NOT NULL AND alm.article_id IS NOT NULL AND COALESCE(si.is_olympics, false) = false)
        OR (si.league_id IS NOT NULL AND alm.article_id IS NOT NULL AND si.team_id IS NULL AND si.school_id IS NULL AND si.country_id IS NULL AND COALESCE(si.is_olympics, false) = false)
        OR (si.sport_id IS NOT NULL AND asm.article_id IS NOT NULL AND si.league_id IS NULL AND si.team_id IS NULL AND si.school_id IS NULL AND si.country_id IS NULL AND COALESCE(si.is_olympics, false) = false)
      );

    -- Create temp table for the final result set (with cursor/limit applied)
    CREATE TEMP TABLE IF NOT EXISTS temp_result_articles (
      article_id int PRIMARY KEY
    ) ON COMMIT DROP;
    TRUNCATE temp_result_articles;

    INSERT INTO temp_result_articles
    SELECT a.id
    FROM articles a
    JOIN temp_feed_articles tfa ON tfa.article_id = a.id
    WHERE a.is_duplicate = false
      AND (p_cursor_time IS NULL OR (COALESCE(a.published_at, a.created_at), a.id) < (p_cursor_time, p_cursor_id))
    ORDER BY COALESCE(a.published_at, a.created_at) DESC, a.id DESC
    LIMIT p_limit;

    -- Batch compute all matched interests for result articles
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
    JOIN subscriber_interests si ON si.subscriber_id = p_subscriber_id AND si.team_id = atm.team_id
    JOIN teams t ON t.id = si.team_id;

    -- People
    INSERT INTO temp_matched
    SELECT apm.article_id, p.name
    FROM temp_result_articles tra
    JOIN article_person_map apm ON apm.article_id = tra.article_id
    JOIN subscriber_interests si ON si.subscriber_id = p_subscriber_id AND si.person_id = apm.person_id
    JOIN people p ON p.id = si.person_id;

    -- Standalone leagues
    INSERT INTO temp_matched
    SELECT alm.article_id, l.code
    FROM temp_result_articles tra
    JOIN article_league_map alm ON alm.article_id = tra.article_id
    JOIN subscriber_interests si ON si.subscriber_id = p_subscriber_id 
      AND si.league_id = alm.league_id 
      AND si.team_id IS NULL AND si.school_id IS NULL AND si.country_id IS NULL
      AND COALESCE(si.is_olympics, false) = false
    JOIN leagues l ON l.id = si.league_id;

    -- Standalone sports
    INSERT INTO temp_matched
    SELECT asm.article_id, COALESCE(sp.display_label, sp.sport)
    FROM temp_result_articles tra
    JOIN article_sport_map asm ON asm.article_id = tra.article_id
    JOIN subscriber_interests si ON si.subscriber_id = p_subscriber_id 
      AND asm.sport_id = ANY(get_sport_with_children(si.sport_id))
      AND si.league_id IS NULL AND si.team_id IS NULL AND si.school_id IS NULL AND si.country_id IS NULL
      AND COALESCE(si.is_olympics, false) = false
    JOIN sports sp ON sp.id = si.sport_id;

    -- Schools with league
    INSERT INTO temp_matched
    SELECT aschm.article_id, sch.short_name || ' (' || l.code || ')'
    FROM temp_result_articles tra
    JOIN article_school_map aschm ON aschm.article_id = tra.article_id
    JOIN subscriber_interests si ON si.subscriber_id = p_subscriber_id 
      AND si.school_id = aschm.school_id AND si.league_id IS NOT NULL
    JOIN article_league_map alm ON alm.article_id = tra.article_id AND alm.league_id = si.league_id
    JOIN schools sch ON sch.id = si.school_id
    JOIN leagues l ON l.id = si.league_id;

    -- Schools without league
    INSERT INTO temp_matched
    SELECT aschm.article_id, sch.short_name || ' (All)'
    FROM temp_result_articles tra
    JOIN article_school_map aschm ON aschm.article_id = tra.article_id
    JOIN subscriber_interests si ON si.subscriber_id = p_subscriber_id 
      AND si.school_id = aschm.school_id AND si.league_id IS NULL
    JOIN schools sch ON sch.id = si.school_id;

    -- Countries with league (non-Olympics)
    INSERT INTO temp_matched
    SELECT acm.article_id, c.name || ' (' || l.code || ')'
    FROM temp_result_articles tra
    JOIN article_country_map acm ON acm.article_id = tra.article_id
    JOIN subscriber_interests si ON si.subscriber_id = p_subscriber_id 
      AND si.country_id = acm.country_id AND si.league_id IS NOT NULL
      AND COALESCE(si.is_olympics, false) = false
    JOIN article_league_map alm ON alm.article_id = tra.article_id AND alm.league_id = si.league_id
    JOIN countries c ON c.id = si.country_id
    JOIN leagues l ON l.id = si.league_id;

    -- Olympics (general)
    INSERT INTO temp_matched
    SELECT tra.article_id, 'Olympics'
    FROM temp_result_articles tra
    JOIN articles a ON a.id = tra.article_id AND a.is_olympics = true
    JOIN subscriber_interests si ON si.subscriber_id = p_subscriber_id 
      AND si.is_olympics = true AND si.sport_id IS NULL AND si.country_id IS NULL;

    -- Olympics with sport only
    INSERT INTO temp_matched
    SELECT tra.article_id, 'Olympics (' || COALESCE(sp.display_label, sp.sport) || ')'
    FROM temp_result_articles tra
    JOIN articles a ON a.id = tra.article_id AND a.is_olympics = true
    JOIN article_sport_map asm ON asm.article_id = tra.article_id
    JOIN subscriber_interests si ON si.subscriber_id = p_subscriber_id 
      AND si.is_olympics = true AND si.sport_id IS NOT NULL AND si.country_id IS NULL
      AND asm.sport_id = ANY(get_sport_with_children(si.sport_id))
    JOIN sports sp ON sp.id = si.sport_id;

    -- Olympics with country only
    INSERT INTO temp_matched
    SELECT tra.article_id, 'Olympics (' || c.name || ')'
    FROM temp_result_articles tra
    JOIN articles a ON a.id = tra.article_id AND a.is_olympics = true
    JOIN article_country_map acm ON acm.article_id = tra.article_id
    JOIN subscriber_interests si ON si.subscriber_id = p_subscriber_id 
      AND si.is_olympics = true AND si.sport_id IS NULL AND si.country_id IS NOT NULL
      AND acm.country_id = si.country_id
    JOIN countries c ON c.id = si.country_id;

    -- Olympics with sport + country
    INSERT INTO temp_matched
    SELECT tra.article_id, 'Olympics (' || COALESCE(sp.display_label, sp.sport) || ', ' || c.name || ')'
    FROM temp_result_articles tra
    JOIN articles a ON a.id = tra.article_id AND a.is_olympics = true
    JOIN article_sport_map asm ON asm.article_id = tra.article_id
    JOIN article_country_map acm ON acm.article_id = tra.article_id
    JOIN subscriber_interests si ON si.subscriber_id = p_subscriber_id 
      AND si.is_olympics = true AND si.sport_id IS NOT NULL AND si.country_id IS NOT NULL
      AND asm.sport_id = ANY(get_sport_with_children(si.sport_id))
      AND acm.country_id = si.country_id
    JOIN sports sp ON sp.id = si.sport_id
    JOIN countries c ON c.id = si.country_id;

    -- Final return with aggregated matched interests
    RETURN QUERY
    SELECT
      a.id AS article_id, a.title, a.url, a.thumbnail_url, a.domain, a.url_domain,
      COALESCE(a.published_at, a.created_at) AS published_effective,
      a.published_at, a.updated_at,
      (SELECT array_agg(DISTINCT tm.label ORDER BY tm.label) FROM temp_matched tm WHERE tm.article_id = a.id) AS matched_interests
    FROM articles a
    JOIN temp_result_articles tra ON tra.article_id = a.id
    ORDER BY COALESCE(a.published_at, a.created_at) DESC, a.id DESC;
  END IF;
END;
$$;