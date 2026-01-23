
CREATE OR REPLACE FUNCTION public.get_subscriber_feed(
  p_subscriber_id uuid, 
  p_limit integer DEFAULT 100, 
  p_cursor_time timestamp with time zone DEFAULT NULL::timestamp with time zone, 
  p_cursor_id bigint DEFAULT NULL::bigint,
  p_interest_id bigint DEFAULT NULL
)
 RETURNS TABLE(article_id bigint, title text, url text, thumbnail_url text, domain text, published_at timestamp with time zone, published_effective timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_has_focus boolean;
  v_interest subscriber_interests%ROWTYPE;
BEGIN
  -- If a specific interest is provided, fetch it and filter to just that interest
  IF p_interest_id IS NOT NULL THEN
    SELECT * INTO v_interest 
    FROM subscriber_interests 
    WHERE id = p_interest_id AND subscriber_id = p_subscriber_id;
    
    IF NOT FOUND THEN
      RETURN; -- No results if interest not found or doesn't belong to user
    END IF;
    
    RETURN QUERY
    WITH matching_articles AS (
      -- Team focus
      SELECT DISTINCT atm.article_id
      FROM article_team_map atm
      WHERE v_interest.team_id IS NOT NULL
        AND atm.team_id = v_interest.team_id
      
      UNION
      
      -- Person focus
      SELECT DISTINCT apm.article_id
      FROM article_person_map apm
      WHERE v_interest.person_id IS NOT NULL
        AND apm.person_id = v_interest.person_id
      
      UNION
      
      -- League ONLY focus (no school/country attached)
      SELECT DISTINCT alm.article_id
      FROM article_league_map alm
      WHERE v_interest.league_id IS NOT NULL
        AND v_interest.school_id IS NULL
        AND v_interest.country_id IS NULL
        AND v_interest.team_id IS NULL
        AND (v_interest.is_olympics IS NULL OR v_interest.is_olympics = false)
        AND alm.league_id = v_interest.league_id
      
      UNION
      
      -- Sport ONLY focus (no league/team/school attached)
      SELECT DISTINCT asm.article_id
      FROM article_sport_map asm
      WHERE v_interest.sport_id IS NOT NULL
        AND v_interest.league_id IS NULL
        AND v_interest.school_id IS NULL
        AND v_interest.team_id IS NULL
        AND (v_interest.is_olympics IS NULL OR v_interest.is_olympics = false)
        AND asm.sport_id = v_interest.sport_id
      
      UNION
      
      -- School ONLY focus (no league attached)
      SELECT DISTINCT ascm.article_id
      FROM article_school_map ascm
      WHERE v_interest.school_id IS NOT NULL
        AND v_interest.league_id IS NULL
        AND ascm.school_id = v_interest.school_id
      
      UNION
      
      -- School WITH League focus (INTERSECTION)
      SELECT DISTINCT a.id
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
      
      UNION
      
      -- Country ONLY focus (no league attached, non-Olympics)
      SELECT DISTINCT acm.article_id
      FROM article_country_map acm
      WHERE v_interest.country_id IS NOT NULL
        AND v_interest.league_id IS NULL
        AND (v_interest.is_olympics IS NULL OR v_interest.is_olympics = false)
        AND acm.country_id = v_interest.country_id
      
      UNION
      
      -- Country WITH League focus (INTERSECTION, e.g., WBC + USA)
      SELECT DISTINCT a.id
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
      
      UNION
      
      -- Olympics focus (INTERSECTION: is_olympics + optional sport + optional country)
      SELECT DISTINCT a.id
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
    )
    SELECT 
      a.id,
      a.title,
      a.url,
      a.thumbnail_url,
      a.url_domain,
      a.published_at,
      COALESCE(a.published_at, a.updated_at, a.created_at) as published_effective,
      a.updated_at
    FROM matching_articles ma
    JOIN articles a ON a.id = ma.article_id
    WHERE (
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

  -- Original logic for full feed (no focus)
  SELECT EXISTS(
    SELECT 1 FROM subscriber_interests
    WHERE subscriber_id = p_subscriber_id AND is_focused = true
  ) INTO v_has_focus;

  RETURN QUERY
  WITH matching_articles AS (
    -- Teams (direct team_id match)
    SELECT DISTINCT atm.article_id
    FROM subscriber_interests si
    JOIN article_team_map atm ON atm.team_id = si.team_id
    WHERE si.subscriber_id = p_subscriber_id 
      AND si.team_id IS NOT NULL
      AND (si.is_olympics IS NULL OR si.is_olympics = false)
      AND (NOT v_has_focus OR si.is_focused = true)
    
    UNION
    
    -- People (direct person_id match)
    SELECT DISTINCT apm.article_id
    FROM subscriber_interests si
    JOIN article_person_map apm ON apm.person_id = si.person_id
    WHERE si.subscriber_id = p_subscriber_id 
      AND si.person_id IS NOT NULL
      AND (si.is_olympics IS NULL OR si.is_olympics = false)
      AND (NOT v_has_focus OR si.is_focused = true)
    
    UNION
    
    -- Leagues ONLY (no school/team/country attached)
    SELECT DISTINCT alm.article_id
    FROM subscriber_interests si
    JOIN article_league_map alm ON alm.league_id = si.league_id
    WHERE si.subscriber_id = p_subscriber_id 
      AND si.league_id IS NOT NULL
      AND si.school_id IS NULL
      AND si.team_id IS NULL
      AND si.country_id IS NULL
      AND (si.is_olympics IS NULL OR si.is_olympics = false)
      AND (NOT v_has_focus OR si.is_focused = true)
    
    UNION
    
    -- Sports ONLY (no league/team/school attached)
    SELECT DISTINCT asm.article_id
    FROM subscriber_interests si
    JOIN article_sport_map asm ON asm.sport_id = si.sport_id
    WHERE si.subscriber_id = p_subscriber_id 
      AND si.sport_id IS NOT NULL
      AND si.league_id IS NULL
      AND si.school_id IS NULL
      AND si.team_id IS NULL
      AND (si.is_olympics IS NULL OR si.is_olympics = false)
      AND (NOT v_has_focus OR si.is_focused = true)
    
    UNION
    
    -- Schools ONLY (no league attached)
    SELECT DISTINCT ascm.article_id
    FROM subscriber_interests si
    JOIN article_school_map ascm ON ascm.school_id = si.school_id
    WHERE si.subscriber_id = p_subscriber_id 
      AND si.school_id IS NOT NULL
      AND si.league_id IS NULL
      AND (si.is_olympics IS NULL OR si.is_olympics = false)
      AND (NOT v_has_focus OR si.is_focused = true)
    
    UNION
    
    -- Schools WITH League (INTERSECTION)
    SELECT DISTINCT a.id
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
    
    UNION
    
    -- Countries ONLY (non-Olympics, no league attached)
    SELECT DISTINCT acm.article_id
    FROM subscriber_interests si
    JOIN article_country_map acm ON acm.country_id = si.country_id
    WHERE si.subscriber_id = p_subscriber_id 
      AND si.country_id IS NOT NULL
      AND si.league_id IS NULL
      AND (si.is_olympics IS NULL OR si.is_olympics = false)
      AND (NOT v_has_focus OR si.is_focused = true)
    
    UNION
    
    -- Countries WITH League (INTERSECTION)
    SELECT DISTINCT a.id
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
    
    UNION
    
    -- Olympics (INTERSECTION)
    SELECT DISTINCT a.id
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
  )
  SELECT 
    a.id,
    a.title,
    a.url,
    a.thumbnail_url,
    a.url_domain,
    a.published_at,
    COALESCE(a.published_at, a.updated_at, a.created_at) as published_effective,
    a.updated_at
  FROM matching_articles ma
  JOIN articles a ON a.id = ma.article_id
  WHERE (
    p_cursor_time IS NULL 
    OR COALESCE(a.published_at, a.updated_at, a.created_at) < p_cursor_time
    OR (
      COALESCE(a.published_at, a.updated_at, a.created_at) = p_cursor_time
      AND a.id < p_cursor_id
    )
  )
  ORDER BY COALESCE(a.published_at, a.updated_at, a.created_at) DESC, a.id DESC
  LIMIT LEAST(p_limit, 200);
END;
$function$;
