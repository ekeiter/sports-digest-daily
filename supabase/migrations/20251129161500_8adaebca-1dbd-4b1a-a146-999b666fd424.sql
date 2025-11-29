-- Drop and recreate get_subscriber_feed function to return url_domain instead of domain
DROP FUNCTION IF EXISTS public.get_subscriber_feed(uuid, integer, timestamptz, bigint);

CREATE FUNCTION public.get_subscriber_feed(
  p_subscriber_id uuid,
  p_limit integer DEFAULT 100,
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
LANGUAGE sql
STABLE
AS $$
  WITH user_interests AS (
    SELECT 
      kind,
      subject_id,
      is_focused
    FROM subscriber_interests
    WHERE subscriber_id = p_subscriber_id
  ),
  focus_exists AS (
    SELECT EXISTS(SELECT 1 FROM user_interests WHERE is_focused = true) AS has_focus
  ),
  ranked_articles AS (
    SELECT DISTINCT
      a.id,
      a.title,
      a.url,
      a.thumbnail_url,
      a.url_domain AS domain,
      a.published_at,
      COALESCE(a.published_at, a.created_at) AS published_effective,
      a.updated_at,
      ROW_NUMBER() OVER (
        PARTITION BY a.id 
        ORDER BY 
          CASE WHEN ui.is_focused THEN 1 ELSE 2 END,
          COALESCE(a.published_at, a.created_at) DESC
      ) AS rn
    FROM articles a
    CROSS JOIN focus_exists fe
    LEFT JOIN article_team_map atm ON a.id = atm.article_id
    LEFT JOIN article_league_map alm ON a.id = alm.article_id
    LEFT JOIN article_person_map apm ON a.id = apm.article_id
    LEFT JOIN article_sport_map asm ON a.id = asm.article_id
    LEFT JOIN user_interests ui ON (
      (ui.kind = 'team' AND atm.team_id = ui.subject_id) OR
      (ui.kind = 'league' AND alm.league_id = ui.subject_id) OR
      (ui.kind = 'person' AND apm.person_id = ui.subject_id) OR
      (ui.kind = 'sport' AND asm.sport_id = ui.subject_id)
    )
    WHERE (
      atm.team_id IN (SELECT subject_id FROM user_interests WHERE kind = 'team') OR
      alm.league_id IN (SELECT subject_id FROM user_interests WHERE kind = 'league') OR
      apm.person_id IN (SELECT subject_id FROM user_interests WHERE kind = 'person') OR
      asm.sport_id IN (SELECT subject_id FROM user_interests WHERE kind = 'sport')
    )
    AND (
      NOT fe.has_focus OR
      ui.is_focused = true
    )
    AND (
      p_cursor_time IS NULL OR
      COALESCE(a.published_at, a.created_at) < p_cursor_time OR
      (COALESCE(a.published_at, a.created_at) = p_cursor_time AND a.id < p_cursor_id)
    )
  )
  SELECT 
    id AS article_id,
    title,
    url,
    thumbnail_url,
    domain,
    published_at,
    published_effective,
    updated_at
  FROM ranked_articles
  WHERE rn = 1
  ORDER BY published_effective DESC, id DESC
  LIMIT p_limit;
$$;