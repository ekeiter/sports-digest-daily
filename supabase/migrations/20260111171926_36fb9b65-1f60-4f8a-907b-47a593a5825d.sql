
CREATE OR REPLACE FUNCTION public.get_subscriber_feed(
  p_subscriber_id uuid,
  p_limit integer DEFAULT 100,
  p_cursor_time timestamp with time zone DEFAULT NULL,
  p_cursor_id bigint DEFAULT NULL
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
SET search_path = public
AS $$
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
    -- Teams (direct team_id match, no intersection needed)
    SELECT DISTINCT atm.article_id
    FROM subscriber_interests si
    JOIN article_team_map atm ON atm.team_id = si.team_id
    WHERE si.subscriber_id = p_subscriber_id 
      AND si.team_id IS NOT NULL
      AND (si.is_olympics IS NULL OR si.is_olympics = false)
      AND (NOT v_has_focus OR si.is_focused = true)
    
    UNION
    
    -- People (direct person_id match, no intersection needed)
    SELECT DISTINCT apm.article_id
    FROM subscriber_interests si
    JOIN article_person_map apm ON apm.person_id = si.person_id
    WHERE si.subscriber_id = p_subscriber_id 
      AND si.person_id IS NOT NULL
      AND (si.is_olympics IS NULL OR si.is_olympics = false)
      AND (NOT v_has_focus OR si.is_focused = true)
    
    UNION
    
    -- Leagues ONLY (no school/team/country attached - pure league follow)
    SELECT DISTINCT alm.article_id
    FROM subscriber_interests si
    JOIN article_league_map alm ON alm.league_id = si.league_id
    WHERE si.subscriber_id = p_subscriber_id 
      AND si.league_id IS NOT NULL
      AND si.school_id IS NULL
      AND si.team_id IS NULL
      AND si.country_id IS NULL  -- No country attached = pure league follow
      AND (si.is_olympics IS NULL OR si.is_olympics = false)
      AND (NOT v_has_focus OR si.is_focused = true)
    
    UNION
    
    -- Sports ONLY (no league/team/school attached - pure sport follow)
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
    
    -- Schools ONLY (no league attached - pure school follow)
    SELECT DISTINCT ascm.article_id
    FROM subscriber_interests si
    JOIN article_school_map ascm ON ascm.school_id = si.school_id
    WHERE si.subscriber_id = p_subscriber_id 
      AND si.school_id IS NOT NULL
      AND si.league_id IS NULL
      AND (si.is_olympics IS NULL OR si.is_olympics = false)
      AND (NOT v_has_focus OR si.is_focused = true)
    
    UNION
    
    -- Schools WITH League (INTERSECTION: article must match school AND league)
    SELECT DISTINCT a.id
    FROM subscriber_interests si
    JOIN article_school_map ascm ON ascm.school_id = si.school_id
    JOIN articles a ON a.id = ascm.article_id
    WHERE si.subscriber_id = p_subscriber_id 
      AND si.school_id IS NOT NULL
      AND si.league_id IS NOT NULL
      AND (si.is_olympics IS NULL OR si.is_olympics = false)
      AND (NOT v_has_focus OR si.is_focused = true)
      -- Article must ALSO match the league
      AND EXISTS (
        SELECT 1 FROM article_league_map alm 
        WHERE alm.article_id = a.id AND alm.league_id = si.league_id
      )
    
    UNION
    
    -- Countries ONLY (non-Olympics context, no league attached)
    SELECT DISTINCT acm.article_id
    FROM subscriber_interests si
    JOIN article_country_map acm ON acm.country_id = si.country_id
    WHERE si.subscriber_id = p_subscriber_id 
      AND si.country_id IS NOT NULL
      AND si.league_id IS NULL  -- No league = pure country follow
      AND (si.is_olympics IS NULL OR si.is_olympics = false)
      AND (NOT v_has_focus OR si.is_focused = true)
    
    UNION
    
    -- Countries WITH League (INTERSECTION: article must match country AND league)
    -- e.g., World Baseball Classic + USA
    SELECT DISTINCT a.id
    FROM subscriber_interests si
    JOIN article_country_map acm ON acm.country_id = si.country_id
    JOIN articles a ON a.id = acm.article_id
    WHERE si.subscriber_id = p_subscriber_id 
      AND si.country_id IS NOT NULL
      AND si.league_id IS NOT NULL
      AND (si.is_olympics IS NULL OR si.is_olympics = false)
      AND (NOT v_has_focus OR si.is_focused = true)
      -- Article must ALSO match the league
      AND EXISTS (
        SELECT 1 FROM article_league_map alm 
        WHERE alm.article_id = a.id AND alm.league_id = si.league_id
      )
    
    UNION
    
    -- Olympics: INTERSECTION logic
    -- Article must be is_olympics=true AND match sport (if specified) AND match country (if specified)
    SELECT DISTINCT a.id
    FROM subscriber_interests si
    JOIN articles a ON a.is_olympics = true
    WHERE si.subscriber_id = p_subscriber_id 
      AND si.is_olympics = true
      AND (NOT v_has_focus OR si.is_focused = true)
      -- If sport_id is specified, article must have that sport
      AND (
        si.sport_id IS NULL 
        OR EXISTS (
          SELECT 1 FROM article_sport_map asm 
          WHERE asm.article_id = a.id AND asm.sport_id = si.sport_id
        )
      )
      -- If country_id is specified, article must have that country
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
$$;
