-- Function to toggle focus status on a subscriber interest
CREATE OR REPLACE FUNCTION public.toggle_interest_focus(
  p_kind interest_kind,
  p_subject_id bigint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscriber_id uuid;
  v_current_focused boolean;
BEGIN
  v_subscriber_id := auth.uid();
  
  IF v_subscriber_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get current focus status
  SELECT is_focused INTO v_current_focused
  FROM subscriber_interests
  WHERE subscriber_id = v_subscriber_id
    AND kind = p_kind
    AND subject_id = p_subject_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Interest not found';
  END IF;

  -- Toggle the focus status
  UPDATE subscriber_interests
  SET is_focused = NOT v_current_focused
  WHERE subscriber_id = v_subscriber_id
    AND kind = p_kind
    AND subject_id = p_subject_id;

  RETURN NOT v_current_focused;
END;
$$;

-- Function to clear all focus (turn off focus mode)
CREATE OR REPLACE FUNCTION public.clear_all_focus()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscriber_id uuid;
BEGIN
  v_subscriber_id := auth.uid();
  
  IF v_subscriber_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE subscriber_interests
  SET is_focused = false
  WHERE subscriber_id = v_subscriber_id
    AND is_focused = true;
END;
$$;

-- Updated get_subscriber_feed to support focus mode and remove time restrictions
CREATE OR REPLACE FUNCTION public.get_subscriber_feed(
  p_subscriber_id uuid,
  p_limit integer DEFAULT 50,
  p_cursor_time timestamp with time zone DEFAULT NULL,
  p_cursor_id bigint DEFAULT NULL
)
RETURNS TABLE(
  article_id bigint,
  title text,
  url text,
  thumbnail_url text,
  domain text,
  published_effective timestamp with time zone,
  published_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH focused_interests AS (
    SELECT kind, subject_id
    FROM public.subscriber_interests
    WHERE subscriber_id = p_subscriber_id
      AND is_focused = true
  ),
  has_focus AS (
    SELECT EXISTS(SELECT 1 FROM focused_interests) AS has_focused
  ),
  active_interests AS (
    SELECT kind, subject_id
    FROM public.subscriber_interests
    WHERE subscriber_id = p_subscriber_id
      AND (
        (SELECT has_focused FROM has_focus) = false
        OR is_focused = true
      )
  )
  SELECT 
    a.id, 
    a.title, 
    a.url, 
    a.thumbnail_url, 
    a.url_domain,
    GREATEST(a.published_at, a.updated_at) as published_effective,
    a.published_at, 
    a.updated_at
  FROM public.articles a
  WHERE (
    EXISTS (
      SELECT 1
      FROM active_interests ai
      WHERE ai.kind = 'team'
        AND EXISTS (
          SELECT 1 FROM public.article_team_map atm
          WHERE atm.article_id = a.id AND atm.team_id = ai.subject_id
        )
    )
    OR
    EXISTS (
      SELECT 1
      FROM active_interests ai
      WHERE ai.kind = 'league'
        AND EXISTS (
          SELECT 1 FROM public.article_league_map alm
          WHERE alm.article_id = a.id AND alm.league_id = ai.subject_id
        )
    )
    OR
    EXISTS (
      SELECT 1
      FROM active_interests ai
      WHERE ai.kind = 'sport'
        AND EXISTS (
          SELECT 1 FROM public.article_sport_map asm
          WHERE asm.article_id = a.id AND asm.sport_id = ai.subject_id
        )
    )
    OR
    EXISTS (
      SELECT 1
      FROM active_interests ai
      WHERE ai.kind = 'person'
        AND EXISTS (
          SELECT 1 FROM public.article_person_map apm
          WHERE apm.article_id = a.id AND apm.person_id = ai.subject_id
        )
    )
  )
  AND (
    p_cursor_time IS NULL
    OR (GREATEST(a.published_at, a.updated_at), a.id) < (p_cursor_time, p_cursor_id)
  )
  ORDER BY published_effective DESC, a.id DESC
  LIMIT LEAST(COALESCE(p_limit, 50), 200);
$$;