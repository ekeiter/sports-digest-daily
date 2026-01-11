
-- Fix get_subscriber_feed to use correct subscriber_interests schema
-- and add missing school/country mappings
CREATE OR REPLACE FUNCTION public.get_subscriber_feed(
  p_subscriber_id uuid, 
  p_limit integer DEFAULT 50, 
  p_cursor_time timestamp with time zone DEFAULT NULL::timestamp with time zone, 
  p_cursor_id bigint DEFAULT NULL::bigint
)
RETURNS TABLE(
  article_id bigint, 
  title text, 
  url text, 
  thumbnail_url text, 
  domain text, 
  published_at timestamp with time zone, 
  published_effective timestamp with time zone, 
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_has_focus boolean;
BEGIN
  -- Check if user has any focused interests
  SELECT EXISTS(
    SELECT 1 FROM subscriber_interests
    WHERE subscriber_id = p_subscriber_id AND is_focused = true
  ) INTO v_has_focus;

  RETURN QUERY
  WITH matching_articles AS (
    -- Teams (using team_id column)
    SELECT DISTINCT atm.article_id
    FROM subscriber_interests si
    JOIN article_team_map atm ON atm.team_id = si.team_id
    WHERE si.subscriber_id = p_subscriber_id 
      AND si.team_id IS NOT NULL
      AND (NOT v_has_focus OR si.is_focused = true)
    
    UNION
    
    -- People (using person_id column)
    SELECT DISTINCT apm.article_id
    FROM subscriber_interests si
    JOIN article_person_map apm ON apm.person_id = si.person_id
    WHERE si.subscriber_id = p_subscriber_id 
      AND si.person_id IS NOT NULL
      AND (NOT v_has_focus OR si.is_focused = true)
    
    UNION
    
    -- Leagues (using league_id column)
    SELECT DISTINCT alm.article_id
    FROM subscriber_interests si
    JOIN article_league_map alm ON alm.league_id = si.league_id
    WHERE si.subscriber_id = p_subscriber_id 
      AND si.league_id IS NOT NULL
      AND (NOT v_has_focus OR si.is_focused = true)
    
    UNION
    
    -- Sports (using sport_id column)
    SELECT DISTINCT asm.article_id
    FROM subscriber_interests si
    JOIN article_sport_map asm ON asm.sport_id = si.sport_id
    WHERE si.subscriber_id = p_subscriber_id 
      AND si.sport_id IS NOT NULL
      AND (NOT v_has_focus OR si.is_focused = true)
    
    UNION
    
    -- Schools (using school_id column)
    SELECT DISTINCT ascm.article_id
    FROM subscriber_interests si
    JOIN article_school_map ascm ON ascm.school_id = si.school_id
    WHERE si.subscriber_id = p_subscriber_id 
      AND si.school_id IS NOT NULL
      AND (NOT v_has_focus OR si.is_focused = true)
    
    UNION
    
    -- Countries (using country_id column)
    SELECT DISTINCT acm.article_id
    FROM subscriber_interests si
    JOIN article_country_map acm ON acm.country_id = si.country_id
    WHERE si.subscriber_id = p_subscriber_id 
      AND si.country_id IS NOT NULL
      AND (NOT v_has_focus OR si.is_focused = true)
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
