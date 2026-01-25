-- Force PostgREST schema cache refresh by dropping and recreating function
DROP FUNCTION IF EXISTS public.get_subscriber_feed(uuid, integer, timestamptz, bigint, bigint);

-- Recreate with explicit RETURNS TABLE matching frontend FeedRow type
CREATE OR REPLACE FUNCTION public.get_subscriber_feed(
  p_subscriber_id uuid,
  p_limit integer DEFAULT 100,
  p_cursor_time timestamptz DEFAULT NULL,
  p_cursor_id bigint DEFAULT NULL,
  p_interest_id bigint DEFAULT NULL
)
RETURNS TABLE (
  article_id bigint,
  title text,
  url text,
  thumbnail_url text,
  domain text,
  published_at timestamptz,
  published_effective timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_has_focus boolean;
  v_interest subscriber_interests%ROWTYPE;
  v_fetch_limit integer;
BEGIN
  v_fetch_limit := LEAST(p_limit + 50, 200);

  IF p_interest_id IS NOT NULL THEN
    SELECT * INTO v_interest 
    FROM subscriber_interests 
    WHERE subscriber_interests.id = p_interest_id 
      AND subscriber_interests.subscriber_id = p_subscriber_id;
    
    IF NOT FOUND THEN
      RETURN;
    END IF;
    
    RETURN QUERY
    WITH matching_articles AS (
      SELECT * FROM (
        SELECT DISTINCT a.id, COALESCE(a.published_at, a.updated_at, a.created_at) as pub_eff
        FROM article_team_map atm
        JOIN articles a ON a.id = atm.article_id
        WHERE v_interest.team_id IS NOT NULL
          AND atm.team_id = v_interest.team_id
          AND (p_cursor_time IS NULL 
               OR COALESCE(a.published_at, a.updated_at, a.created_at) < p_cursor_time
               OR (COALESCE(a.published_at, a.updated_at, a.created_at) = p_cursor_time AND a.id < p_cursor_id))
        ORDER BY COALESCE(a.published_at, a.updated_at, a.created_at) DESC, a.id DESC
        LIMIT v_fetch_limit
      ) team_articles
      
      UNION
      
      SELECT * FROM (
        SELECT DISTINCT a.id, COALESCE(a.published_at, a.updated_at, a.created_at) as pub_eff
        FROM article_person_map apm
        JOIN articles a ON a.id = apm.article_id
        WHERE v_interest.person_id IS NOT NULL
          AND apm.person_id = v_interest.person_id
          AND (p_cursor_time IS NULL 
               OR COALESCE(a.published_at, a.updated_at, a.created_at) < p_cursor_time
               OR (COALESCE(a.published_at, a.updated_at, a.created_at) = p_cursor_time AND a.id < p_cursor_id))
        ORDER BY COALESCE(a.published_at, a.updated_at, a.created_at) DESC, a.id DESC
        LIMIT v_fetch_limit
      ) person_articles
      
      UNION
      
      SELECT * FROM (
        SELECT DISTINCT a.id, COALESCE(a.published_at, a.updated_at, a.created_at) as pub_eff
        FROM article_league_map alm
        JOIN articles a ON a.id = alm.article_id
        WHERE v_interest.league_id IS NOT NULL
          AND v_interest.school_id IS NULL
          AND v_interest.country_id IS NULL
          AND v_interest.team_id IS NULL
          AND (v_interest.is_olympics IS NULL OR v_interest.is_olympics = false)
          AND alm.league_id = v_interest.league_id
          AND (p_cursor_time IS NULL 
               OR COALESCE(a.published_at, a.updated_at, a.created_at) < p_cursor_time
               OR (COALESCE(a.published_at, a.updated_at, a.created_at) = p_cursor_time AND a.id < p_cursor_id))
        ORDER BY COALESCE(a.published_at, a.updated_at, a.created_at) DESC, a.id DESC
        LIMIT v_fetch_limit
      ) league_articles
      
      UNION
      
      SELECT * FROM (
        SELECT DISTINCT a.id, COALESCE(a.published_at, a.updated_at, a.created_at) as pub_eff
        FROM article_sport_map asm
        JOIN articles a ON a.id = asm.article_id
        WHERE v_interest.sport_id IS NOT NULL
          AND v_interest.league_id IS NULL
          AND v_interest.school_id IS NULL
          AND v_interest.team_id IS NULL
          AND (v_interest.is_olympics IS NULL OR v_interest.is_olympics = false)
          AND asm.sport_id = v_interest.sport_id
          AND (p_cursor_time IS NULL 
               OR COALESCE(a.published_at, a.updated_at, a.created_at) < p_cursor_time
               OR (COALESCE(a.published_at, a.updated_at, a.created_at) = p_cursor_time AND a.id < p_cursor_id))
        ORDER BY COALESCE(a.published_at, a.updated_at, a.created_at) DESC, a.id DESC
        LIMIT v_fetch_limit
      ) sport_articles
      
      UNION
      
      SELECT * FROM (
        SELECT DISTINCT a.id, COALESCE(a.published_at, a.updated_at, a.created_at) as pub_eff
        FROM article_school_map ascm
        JOIN articles a ON a.id = ascm.article_id
        WHERE v_interest.school_id IS NOT NULL
          AND v_interest.league_id IS NULL
          AND ascm.school_id = v_interest.school_id
          AND (p_cursor_time IS NULL 
               OR COALESCE(a.published_at, a.updated_at, a.created_at) < p_cursor_time
               OR (COALESCE(a.published_at, a.updated_at, a.created_at) = p_cursor_time AND a.id < p_cursor_id))
        ORDER BY COALESCE(a.published_at, a.updated_at, a.created_at) DESC, a.id DESC
        LIMIT v_fetch_limit
      ) school_articles
      
      UNION
      
      SELECT * FROM (
        SELECT DISTINCT a.id, COALESCE(a.published_at, a.updated_at, a.created_at) as pub_eff
        FROM article_school_map ascm
        JOIN articles a ON a.id = ascm.article_id
        WHERE v_interest.school_id IS NOT NULL
          AND v_interest.league_id IS NOT NULL
          AND (v_interest.is_olympics IS NULL OR v_interest.is_olympics = false)
          AND ascm.school_id = v_interest.school_id
          AND EXISTS (
            SELECT 1 FROM article_league_map alm 
            WHERE alm.article_id = a.id AND alm.league_id = v_interest.league_id
          )
          AND (p_cursor_time IS NULL 
               OR COALESCE(a.published_at, a.updated_at, a.created_at) < p_cursor_time
               OR (COALESCE(a.published_at, a.updated_at, a.created_at) = p_cursor_time AND a.id < p_cursor_id))
        ORDER BY COALESCE(a.published_at, a.updated_at, a.created_at) DESC, a.id DESC
        LIMIT v_fetch_limit
      ) school_league_articles
      
      UNION
      
      SELECT * FROM (
        SELECT DISTINCT a.id, COALESCE(a.published_at, a.updated_at, a.created_at) as pub_eff
        FROM article_country_map acm
        JOIN articles a ON a.id = acm.article_id
        WHERE v_interest.country_id IS NOT NULL
          AND v_interest.league_id IS NULL
          AND (v_interest.is_olympics IS NULL OR v_interest.is_olympics = false)
          AND acm.country_id = v_interest.country_id
          AND (p_cursor_time IS NULL 
               OR COALESCE(a.published_at, a.updated_at, a.created_at) < p_cursor_time
               OR (COALESCE(a.published_at, a.updated_at, a.created_at) = p_cursor_time AND a.id < p_cursor_id))
        ORDER BY COALESCE(a.published_at, a.updated_at, a.created_at) DESC, a.id DESC
        LIMIT v_fetch_limit
      ) country_articles
      
      UNION
      
      SELECT * FROM (
        SELECT DISTINCT a.id, COALESCE(a.published_at, a.updated_at, a.created_at) as pub_eff
        FROM article_country_map acm
        JOIN articles a ON a.id = acm.article_id
        WHERE v_interest.country_id IS NOT NULL
          AND v_interest.league_id IS NOT NULL
          AND (v_interest.is_olympics IS NULL OR v_interest.is_olympics = false)
          AND acm.country_id = v_interest.country_id
          AND EXISTS (
            SELECT 1 FROM article_league_map alm 
            WHERE alm.article_id = a.id AND alm.league_id = v_interest.league_id
          )
          AND (p_cursor_time IS NULL 
               OR COALESCE(a.published_at, a.updated_at, a.created_at) < p_cursor_time
               OR (COALESCE(a.published_at, a.updated_at, a.created_at) = p_cursor_time AND a.id < p_cursor_id))
        ORDER BY COALESCE(a.published_at, a.updated_at, a.created_at) DESC, a.id DESC
        LIMIT v_fetch_limit
      ) country_league_articles
      
      UNION
      
      SELECT * FROM (
        SELECT DISTINCT a.id, COALESCE(a.published_at, a.updated_at, a.created_at) as pub_eff
        FROM articles a
        WHERE v_interest.is_olympics = true
          AND a.is_olympics = true
          AND (
            v_interest.sport_id IS NULL 
            OR EXISTS (
              SELECT 1 FROM article_sport_map asm 
              WHERE asm.article_id = a.id AND asm.sport_id = v_interest.sport_id
            )
          )
          AND (
            v_interest.country_id IS NULL 
            OR EXISTS (
              SELECT 1 FROM article_country_map acm 
              WHERE acm.article_id = a.id AND acm.country_id = v_interest.country_id
            )
          )
          AND (p_cursor_time IS NULL 
               OR COALESCE(a.published_at, a.updated_at, a.created_at) < p_cursor_time
               OR (COALESCE(a.published_at, a.updated_at, a.created_at) = p_cursor_time AND a.id < p_cursor_id))
        ORDER BY COALESCE(a.published_at, a.updated_at, a.created_at) DESC, a.id DESC
        LIMIT v_fetch_limit
      ) olympics_articles
    )
    SELECT 
      a.id AS article_id,
      a.title,
      a.url,
      a.thumbnail_url,
      a.domain,
      a.published_at,
      COALESCE(a.published_at, a.updated_at, a.created_at) as published_effective,
      a.updated_at
    FROM matching_articles ma
    JOIN articles a ON a.id = ma.id
    ORDER BY COALESCE(a.published_at, a.updated_at, a.created_at) DESC, a.id DESC
    LIMIT p_limit;
    
    RETURN;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM subscriber_interests
    WHERE subscriber_id = p_subscriber_id AND is_focused = true
  ) INTO v_has_focus;

  RETURN QUERY
  WITH matching_articles AS (
    SELECT * FROM (
      SELECT DISTINCT a.id, COALESCE(a.published_at, a.updated_at, a.created_at) as pub_eff
      FROM subscriber_interests si
      JOIN article_team_map atm ON atm.team_id = si.team_id
      JOIN articles a ON a.id = atm.article_id
      WHERE si.subscriber_id = p_subscriber_id 
        AND si.team_id IS NOT NULL
        AND (si.is_olympics IS NULL OR si.is_olympics = false)
        AND (NOT v_has_focus OR si.is_focused = true)
        AND (p_cursor_time IS NULL 
             OR COALESCE(a.published_at, a.updated_at, a.created_at) < p_cursor_time
             OR (COALESCE(a.published_at, a.updated_at, a.created_at) = p_cursor_time AND a.id < p_cursor_id))
      ORDER BY COALESCE(a.published_at, a.updated_at, a.created_at) DESC, a.id DESC
      LIMIT v_fetch_limit
    ) team_articles
    
    UNION
    
    SELECT * FROM (
      SELECT DISTINCT a.id, COALESCE(a.published_at, a.updated_at, a.created_at) as pub_eff
      FROM subscriber_interests si
      JOIN article_person_map apm ON apm.person_id = si.person_id
      JOIN articles a ON a.id = apm.article_id
      WHERE si.subscriber_id = p_subscriber_id 
        AND si.person_id IS NOT NULL
        AND (si.is_olympics IS NULL OR si.is_olympics = false)
        AND (NOT v_has_focus OR si.is_focused = true)
        AND (p_cursor_time IS NULL 
             OR COALESCE(a.published_at, a.updated_at, a.created_at) < p_cursor_time
             OR (COALESCE(a.published_at, a.updated_at, a.created_at) = p_cursor_time AND a.id < p_cursor_id))
      ORDER BY COALESCE(a.published_at, a.updated_at, a.created_at) DESC, a.id DESC
      LIMIT v_fetch_limit
    ) person_articles
    
    UNION
    
    SELECT * FROM (
      SELECT DISTINCT a.id, COALESCE(a.published_at, a.updated_at, a.created_at) as pub_eff
      FROM subscriber_interests si
      JOIN article_league_map alm ON alm.league_id = si.league_id
      JOIN articles a ON a.id = alm.article_id
      WHERE si.subscriber_id = p_subscriber_id 
        AND si.league_id IS NOT NULL
        AND si.school_id IS NULL
        AND si.team_id IS NULL
        AND si.country_id IS NULL
        AND (si.is_olympics IS NULL OR si.is_olympics = false)
        AND (NOT v_has_focus OR si.is_focused = true)
        AND (p_cursor_time IS NULL 
             OR COALESCE(a.published_at, a.updated_at, a.created_at) < p_cursor_time
             OR (COALESCE(a.published_at, a.updated_at, a.created_at) = p_cursor_time AND a.id < p_cursor_id))
      ORDER BY COALESCE(a.published_at, a.updated_at, a.created_at) DESC, a.id DESC
      LIMIT v_fetch_limit
    ) league_articles
    
    UNION
    
    SELECT * FROM (
      SELECT DISTINCT a.id, COALESCE(a.published_at, a.updated_at, a.created_at) as pub_eff
      FROM subscriber_interests si
      JOIN article_sport_map asm ON asm.sport_id = si.sport_id
      JOIN articles a ON a.id = asm.article_id
      WHERE si.subscriber_id = p_subscriber_id 
        AND si.sport_id IS NOT NULL
        AND si.league_id IS NULL
        AND si.school_id IS NULL
        AND si.team_id IS NULL
        AND (si.is_olympics IS NULL OR si.is_olympics = false)
        AND (NOT v_has_focus OR si.is_focused = true)
        AND (p_cursor_time IS NULL 
             OR COALESCE(a.published_at, a.updated_at, a.created_at) < p_cursor_time
             OR (COALESCE(a.published_at, a.updated_at, a.created_at) = p_cursor_time AND a.id < p_cursor_id))
      ORDER BY COALESCE(a.published_at, a.updated_at, a.created_at) DESC, a.id DESC
      LIMIT v_fetch_limit
    ) sport_articles
    
    UNION
    
    SELECT * FROM (
      SELECT DISTINCT a.id, COALESCE(a.published_at, a.updated_at, a.created_at) as pub_eff
      FROM subscriber_interests si
      JOIN article_school_map ascm ON ascm.school_id = si.school_id
      JOIN articles a ON a.id = ascm.article_id
      WHERE si.subscriber_id = p_subscriber_id 
        AND si.school_id IS NOT NULL
        AND si.league_id IS NULL
        AND (si.is_olympics IS NULL OR si.is_olympics = false)
        AND (NOT v_has_focus OR si.is_focused = true)
        AND (p_cursor_time IS NULL 
             OR COALESCE(a.published_at, a.updated_at, a.created_at) < p_cursor_time
             OR (COALESCE(a.published_at, a.updated_at, a.created_at) = p_cursor_time AND a.id < p_cursor_id))
      ORDER BY COALESCE(a.published_at, a.updated_at, a.created_at) DESC, a.id DESC
      LIMIT v_fetch_limit
    ) school_articles
    
    UNION
    
    SELECT * FROM (
      SELECT DISTINCT a.id, COALESCE(a.published_at, a.updated_at, a.created_at) as pub_eff
      FROM subscriber_interests si
      JOIN article_school_map ascm ON ascm.school_id = si.school_id
      JOIN articles a ON a.id = ascm.article_id
      WHERE si.subscriber_id = p_subscriber_id 
        AND si.school_id IS NOT NULL
        AND si.league_id IS NOT NULL
        AND (si.is_olympics IS NULL OR si.is_olympics = false)
        AND (NOT v_has_focus OR si.is_focused = true)
        AND EXISTS (
          SELECT 1 FROM article_league_map alm 
          WHERE alm.article_id = a.id AND alm.league_id = si.league_id
        )
        AND (p_cursor_time IS NULL 
             OR COALESCE(a.published_at, a.updated_at, a.created_at) < p_cursor_time
             OR (COALESCE(a.published_at, a.updated_at, a.created_at) = p_cursor_time AND a.id < p_cursor_id))
      ORDER BY COALESCE(a.published_at, a.updated_at, a.created_at) DESC, a.id DESC
      LIMIT v_fetch_limit
    ) school_league_articles
    
    UNION
    
    SELECT * FROM (
      SELECT DISTINCT a.id, COALESCE(a.published_at, a.updated_at, a.created_at) as pub_eff
      FROM subscriber_interests si
      JOIN article_country_map acm ON acm.country_id = si.country_id
      JOIN articles a ON a.id = acm.article_id
      WHERE si.subscriber_id = p_subscriber_id 
        AND si.country_id IS NOT NULL
        AND si.league_id IS NULL
        AND (si.is_olympics IS NULL OR si.is_olympics = false)
        AND (NOT v_has_focus OR si.is_focused = true)
        AND (p_cursor_time IS NULL 
             OR COALESCE(a.published_at, a.updated_at, a.created_at) < p_cursor_time
             OR (COALESCE(a.published_at, a.updated_at, a.created_at) = p_cursor_time AND a.id < p_cursor_id))
      ORDER BY COALESCE(a.published_at, a.updated_at, a.created_at) DESC, a.id DESC
      LIMIT v_fetch_limit
    ) country_articles
    
    UNION
    
    SELECT * FROM (
      SELECT DISTINCT a.id, COALESCE(a.published_at, a.updated_at, a.created_at) as pub_eff
      FROM subscriber_interests si
      JOIN article_country_map acm ON acm.country_id = si.country_id
      JOIN articles a ON a.id = acm.article_id
      WHERE si.subscriber_id = p_subscriber_id 
        AND si.country_id IS NOT NULL
        AND si.league_id IS NOT NULL
        AND (si.is_olympics IS NULL OR si.is_olympics = false)
        AND (NOT v_has_focus OR si.is_focused = true)
        AND EXISTS (
          SELECT 1 FROM article_league_map alm 
          WHERE alm.article_id = a.id AND alm.league_id = si.league_id
        )
        AND (p_cursor_time IS NULL 
             OR COALESCE(a.published_at, a.updated_at, a.created_at) < p_cursor_time
             OR (COALESCE(a.published_at, a.updated_at, a.created_at) = p_cursor_time AND a.id < p_cursor_id))
      ORDER BY COALESCE(a.published_at, a.updated_at, a.created_at) DESC, a.id DESC
      LIMIT v_fetch_limit
    ) country_league_articles
    
    UNION
    
    SELECT * FROM (
      SELECT DISTINCT a.id, COALESCE(a.published_at, a.updated_at, a.created_at) as pub_eff
      FROM subscriber_interests si
      JOIN articles a ON a.is_olympics = true
      WHERE si.subscriber_id = p_subscriber_id 
        AND si.is_olympics = true
        AND (NOT v_has_focus OR si.is_focused = true)
        AND (
          si.sport_id IS NULL 
          OR EXISTS (
            SELECT 1 FROM article_sport_map asm 
            WHERE asm.article_id = a.id AND asm.sport_id = si.sport_id
          )
        )
        AND (
          si.country_id IS NULL 
          OR EXISTS (
            SELECT 1 FROM article_country_map acm 
            WHERE acm.article_id = a.id AND acm.country_id = si.country_id
          )
        )
        AND (p_cursor_time IS NULL 
             OR COALESCE(a.published_at, a.updated_at, a.created_at) < p_cursor_time
             OR (COALESCE(a.published_at, a.updated_at, a.created_at) = p_cursor_time AND a.id < p_cursor_id))
      ORDER BY COALESCE(a.published_at, a.updated_at, a.created_at) DESC, a.id DESC
      LIMIT v_fetch_limit
    ) olympics_articles
  )
  SELECT 
    a.id AS article_id,
    a.title,
    a.url,
    a.thumbnail_url,
    a.domain,
    a.published_at,
    COALESCE(a.published_at, a.updated_at, a.created_at) as published_effective,
    a.updated_at
  FROM matching_articles ma
  JOIN articles a ON a.id = ma.id
  ORDER BY COALESCE(a.published_at, a.updated_at, a.created_at) DESC, a.id DESC
  LIMIT p_limit;
END;
$$;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';