
CREATE OR REPLACE FUNCTION public.get_trending_teams(p_hours integer DEFAULT 2, p_limit integer DEFAULT 20)
 RETURNS TABLE(
   entity_type text,
   entity_id bigint,
   entity_name text,
   article_count integer,
   logo_url text,
   league_code text,
   league_logo_url text
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $$
  WITH recent_articles AS (
    SELECT id
    FROM public.articles
    WHERE published_at >= (now() - make_interval(hours => p_hours))
  ),
  -- Teams
  team_counts AS (
    SELECT 
      'team'::text AS entity_type,
      atm.team_id AS entity_id,
      COUNT(DISTINCT atm.article_id)::integer AS article_count
    FROM public.article_team_map atm
    JOIN recent_articles ra ON ra.id = atm.article_id
    GROUP BY atm.team_id
  ),
  -- Schools
  school_counts AS (
    SELECT 
      'school'::text AS entity_type,
      aschm.school_id::bigint AS entity_id,
      COUNT(DISTINCT aschm.article_id)::integer AS article_count
    FROM public.article_school_map aschm
    JOIN recent_articles ra ON ra.id = aschm.article_id
    GROUP BY aschm.school_id
  ),
  -- Countries (only those that belong to a league)
  country_counts AS (
    SELECT 
      'country'::text AS entity_type,
      acm.country_id::bigint AS entity_id,
      COUNT(DISTINCT acm.article_id)::integer AS article_count
    FROM public.article_country_map acm
    JOIN recent_articles ra ON ra.id = acm.article_id
    JOIN public.league_countries lc ON lc.country_id = acm.country_id AND lc.is_active = true
    GROUP BY acm.country_id
  ),
  -- Union all and rank
  combined AS (
    SELECT * FROM team_counts
    UNION ALL
    SELECT * FROM school_counts
    UNION ALL
    SELECT * FROM country_counts
  ),
  ranked AS (
    SELECT *
    FROM combined
    ORDER BY article_count DESC
    LIMIT LEAST(p_limit, 50)
  ),
  -- Fallback logos from preference_menu_items
  league_logos AS (
    SELECT DISTINCT ON (entity_id) entity_id, logo_url
    FROM public.preference_menu_items
    WHERE entity_type = 'league' AND logo_url IS NOT NULL
    ORDER BY entity_id, id
  )
  -- Final select with entity details
  SELECT
    r.entity_type,
    r.entity_id,
    CASE 
      WHEN r.entity_type = 'team' THEN t.display_name
      WHEN r.entity_type = 'school' THEN sch.short_name
      WHEN r.entity_type = 'country' THEN c.name
    END AS entity_name,
    r.article_count,
    CASE 
      WHEN r.entity_type = 'team' THEN t.logo_url
      WHEN r.entity_type = 'school' THEN sch.logo_url
      WHEN r.entity_type = 'country' THEN c.logo_url
    END AS logo_url,
    CASE 
      WHEN r.entity_type = 'team' THEN (
        SELECT l.code FROM public.league_teams lt 
        JOIN public.leagues l ON l.id = lt.league_id 
        WHERE lt.team_id = r.entity_id AND lt.is_primary = true 
        LIMIT 1
      )
      WHEN r.entity_type = 'school' THEN (
        SELECT l.code FROM public.league_schools ls
        JOIN public.leagues l ON l.id = ls.league_id
        WHERE ls.school_id = r.entity_id::integer AND ls.is_active = true
        ORDER BY l.app_order_id NULLS LAST
        LIMIT 1
      )
      WHEN r.entity_type = 'country' THEN (
        SELECT l.code FROM public.league_countries lc2
        JOIN public.leagues l ON l.id = lc2.league_id
        WHERE lc2.country_id = r.entity_id::integer AND lc2.is_active = true
        ORDER BY l.app_order_id NULLS LAST
        LIMIT 1
      )
    END AS league_code,
    CASE 
      WHEN r.entity_type = 'team' THEN (
        SELECT COALESCE(l.logo_url, pmi.logo_url) FROM public.league_teams lt 
        JOIN public.leagues l ON l.id = lt.league_id 
        LEFT JOIN league_logos pmi ON pmi.entity_id = l.id
        WHERE lt.team_id = r.entity_id AND lt.is_primary = true 
        LIMIT 1
      )
      WHEN r.entity_type = 'school' THEN (
        SELECT COALESCE(l.logo_url, pmi.logo_url) FROM public.league_schools ls
        JOIN public.leagues l ON l.id = ls.league_id
        LEFT JOIN league_logos pmi ON pmi.entity_id = l.id
        WHERE ls.school_id = r.entity_id::integer AND ls.is_active = true
        ORDER BY l.app_order_id NULLS LAST
        LIMIT 1
      )
      WHEN r.entity_type = 'country' THEN (
        SELECT COALESCE(l.logo_url, pmi.logo_url) FROM public.league_countries lc2
        JOIN public.leagues l ON l.id = lc2.league_id
        LEFT JOIN league_logos pmi ON pmi.entity_id = l.id
        WHERE lc2.country_id = r.entity_id::integer AND lc2.is_active = true
        ORDER BY l.app_order_id NULLS LAST
        LIMIT 1
      )
    END AS league_logo_url
  FROM ranked r
  LEFT JOIN public.teams t ON r.entity_type = 'team' AND t.id = r.entity_id
  LEFT JOIN public.schools sch ON r.entity_type = 'school' AND sch.id = r.entity_id::integer
  LEFT JOIN public.countries c ON r.entity_type = 'country' AND c.id = r.entity_id::integer
  ORDER BY r.article_count DESC;
$$;
