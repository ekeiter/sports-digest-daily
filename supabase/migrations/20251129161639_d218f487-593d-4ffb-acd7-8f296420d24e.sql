-- Drop and recreate get_subscriber_feed with optimized query using url_domain
DROP FUNCTION IF EXISTS public.get_subscriber_feed(uuid, integer, timestamptz, bigint);

CREATE FUNCTION public.get_subscriber_feed(
  p_subscriber_id uuid,
  p_limit integer DEFAULT 50,
  p_cursor_time timestamptz DEFAULT NULL,
  p_cursor_id bigint DEFAULT NULL
)
RETURNS TABLE(
  article_id bigint,
  title text,
  url text,
  thumbnail_url text,
  domain text,
  published_at timestamptz,
  published_effective timestamptz,
  updated_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_focus boolean;
BEGIN
  -- Check if user has any focused interests
  SELECT EXISTS(
    SELECT 1 FROM subscriber_interests
    WHERE subscriber_id = p_subscriber_id AND is_focused = true
  ) INTO v_has_focus;

  -- If cursor provided, paginate from that point
  IF p_cursor_time IS NOT NULL AND p_cursor_id IS NOT NULL THEN
    RETURN QUERY
    SELECT DISTINCT
      a.id,
      a.title,
      a.url,
      a.thumbnail_url,
      a.url_domain,
      a.published_at,
      a.updated_at,
      COALESCE(a.published_at, a.updated_at, a.created_at) as published_effective
    FROM articles a
    WHERE (
      -- If focus mode is active, only show focused interests
      (v_has_focus AND (
        EXISTS(
          SELECT 1 FROM article_team_map atm
          JOIN subscriber_interests si ON si.subject_id = atm.team_id
          WHERE atm.article_id = a.id 
            AND si.subscriber_id = p_subscriber_id 
            AND si.kind = 'team'
            AND si.is_focused = true
        )
        OR EXISTS(
          SELECT 1 FROM article_person_map apm
          JOIN subscriber_interests si ON si.subject_id = apm.person_id
          WHERE apm.article_id = a.id 
            AND si.subscriber_id = p_subscriber_id 
            AND si.kind = 'person'
            AND si.is_focused = true
        )
        OR EXISTS(
          SELECT 1 FROM article_league_map alm
          JOIN subscriber_interests si ON si.subject_id = alm.league_id
          WHERE alm.article_id = a.id 
            AND si.subscriber_id = p_subscriber_id 
            AND si.kind = 'league'
            AND si.is_focused = true
        )
        OR EXISTS(
          SELECT 1 FROM article_sport_map asm
          JOIN subscriber_interests si ON si.subject_id = asm.sport_id
          WHERE asm.article_id = a.id 
            AND si.subscriber_id = p_subscriber_id 
            AND si.kind = 'sport'
            AND si.is_focused = true
        )
      ))
      -- If no focus mode, show all interests
      OR (NOT v_has_focus AND (
        EXISTS(
          SELECT 1 FROM article_team_map atm
          JOIN subscriber_interests si ON si.subject_id = atm.team_id
          WHERE atm.article_id = a.id 
            AND si.subscriber_id = p_subscriber_id 
            AND si.kind = 'team'
        )
        OR EXISTS(
          SELECT 1 FROM article_person_map apm
          JOIN subscriber_interests si ON si.subject_id = apm.person_id
          WHERE apm.article_id = a.id 
            AND si.subscriber_id = p_subscriber_id 
            AND si.kind = 'person'
        )
        OR EXISTS(
          SELECT 1 FROM article_league_map alm
          JOIN subscriber_interests si ON si.subject_id = alm.league_id
          WHERE alm.article_id = a.id 
            AND si.subscriber_id = p_subscriber_id 
            AND si.kind = 'league'
        )
        OR EXISTS(
          SELECT 1 FROM article_sport_map asm
          JOIN subscriber_interests si ON si.subject_id = asm.sport_id
          WHERE asm.article_id = a.id 
            AND si.subscriber_id = p_subscriber_id 
            AND si.kind = 'sport'
        )
      ))
    )
    AND (
      COALESCE(a.published_at, a.updated_at, a.created_at) < p_cursor_time
      OR (
        COALESCE(a.published_at, a.updated_at, a.created_at) = p_cursor_time
        AND a.id < p_cursor_id
      )
    )
    ORDER BY published_effective DESC, a.id DESC
    LIMIT LEAST(p_limit, 200);
  ELSE
    -- Initial load without cursor
    RETURN QUERY
    SELECT DISTINCT
      a.id,
      a.title,
      a.url,
      a.thumbnail_url,
      a.url_domain,
      a.published_at,
      a.updated_at,
      COALESCE(a.published_at, a.updated_at, a.created_at) as published_effective
    FROM articles a
    WHERE (
      -- If focus mode is active, only show focused interests
      (v_has_focus AND (
        EXISTS(
          SELECT 1 FROM article_team_map atm
          JOIN subscriber_interests si ON si.subject_id = atm.team_id
          WHERE atm.article_id = a.id 
            AND si.subscriber_id = p_subscriber_id 
            AND si.kind = 'team'
            AND si.is_focused = true
        )
        OR EXISTS(
          SELECT 1 FROM article_person_map apm
          JOIN subscriber_interests si ON si.subject_id = apm.person_id
          WHERE apm.article_id = a.id 
            AND si.subscriber_id = p_subscriber_id 
            AND si.kind = 'person'
            AND si.is_focused = true
        )
        OR EXISTS(
          SELECT 1 FROM article_league_map alm
          JOIN subscriber_interests si ON si.subject_id = alm.league_id
          WHERE alm.article_id = a.id 
            AND si.subscriber_id = p_subscriber_id 
            AND si.kind = 'league'
            AND si.is_focused = true
        )
        OR EXISTS(
          SELECT 1 FROM article_sport_map asm
          JOIN subscriber_interests si ON si.subject_id = asm.sport_id
          WHERE asm.article_id = a.id 
            AND si.subscriber_id = p_subscriber_id 
            AND si.kind = 'sport'
            AND si.is_focused = true
        )
      ))
      -- If no focus mode, show all interests
      OR (NOT v_has_focus AND (
        EXISTS(
          SELECT 1 FROM article_team_map atm
          JOIN subscriber_interests si ON si.subject_id = atm.team_id
          WHERE atm.article_id = a.id 
            AND si.subscriber_id = p_subscriber_id 
            AND si.kind = 'team'
        )
        OR EXISTS(
          SELECT 1 FROM article_person_map apm
          JOIN subscriber_interests si ON si.subject_id = apm.person_id
          WHERE apm.article_id = a.id 
            AND si.subscriber_id = p_subscriber_id 
            AND si.kind = 'person'
        )
        OR EXISTS(
          SELECT 1 FROM article_league_map alm
          JOIN subscriber_interests si ON si.subject_id = alm.league_id
          WHERE alm.article_id = a.id 
            AND si.subscriber_id = p_subscriber_id 
            AND si.kind = 'league'
        )
        OR EXISTS(
          SELECT 1 FROM article_sport_map asm
          JOIN subscriber_interests si ON si.subject_id = asm.sport_id
          WHERE asm.article_id = a.id 
            AND si.subscriber_id = p_subscriber_id 
            AND si.kind = 'sport'
        )
      ))
    )
    ORDER BY published_effective DESC, a.id DESC
    LIMIT LEAST(p_limit, 200);
  END IF;
END;
$$;