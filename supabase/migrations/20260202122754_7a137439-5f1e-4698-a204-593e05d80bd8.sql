
CREATE OR REPLACE FUNCTION public.get_trending_people(p_hours integer DEFAULT 2, p_limit integer DEFAULT 20)
 RETURNS TABLE(person_id bigint, person_name text, article_count integer, person_role text, person_position text, sport_name text, sport_logo_url text, league_code text, league_logo_url text, team_name text, team_logo_url text, school_short_name text, school_logo_url text, person_country_code text, country_logo_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  WITH recent_articles AS (
    SELECT id
    FROM public.articles
    WHERE published_at >= (now() - make_interval(hours => p_hours))
  ),
  person_counts AS (
    SELECT 
      apm.person_id,
      COUNT(DISTINCT apm.article_id)::integer AS article_count
    FROM public.article_person_map apm
    JOIN recent_articles ra ON ra.id = apm.article_id
    GROUP BY apm.person_id
    ORDER BY article_count DESC
    LIMIT LEAST(p_limit, 50)
  ),
  -- Get first matching logo from preference_menu_items (deduplicated)
  sport_logos AS (
    SELECT DISTINCT ON (entity_id) entity_id, logo_url
    FROM public.preference_menu_items
    WHERE entity_type = 'sport' AND logo_url IS NOT NULL
    ORDER BY entity_id, id
  ),
  league_logos AS (
    SELECT DISTINCT ON (entity_id) entity_id, logo_url
    FROM public.preference_menu_items
    WHERE entity_type = 'league' AND logo_url IS NOT NULL
    ORDER BY entity_id, id
  )
  SELECT 
    p.id AS person_id,
    p.name AS person_name,
    pc.article_count,
    p.role AS person_role,
    p."position" AS person_position,
    s.sport AS sport_name,
    COALESCE(s.logo_url, pmi_sport.logo_url) AS sport_logo_url,
    l.code AS league_code,
    COALESCE(l.logo_url, pmi_league.logo_url) AS league_logo_url,
    t.display_name AS team_name,
    t.logo_url AS team_logo_url,
    sch.short_name AS school_short_name,
    sch.logo_url AS school_logo_url,
    p.country_code AS person_country_code,
    c.logo_url AS country_logo_url
  FROM person_counts pc
  JOIN public.people p ON p.id = pc.person_id
  LEFT JOIN public.sports s ON s.id = p.sport_id
  LEFT JOIN public.leagues l ON l.id = p.league_id
  LEFT JOIN public.teams t ON t.id = p.team_id
  LEFT JOIN public.schools sch ON sch.id = p.school_id
  LEFT JOIN public.countries c ON c.code = p.country_code
  LEFT JOIN sport_logos pmi_sport ON pmi_sport.entity_id = p.sport_id
  LEFT JOIN league_logos pmi_league ON pmi_league.entity_id = p.league_id
  ORDER BY pc.article_count DESC;
$function$
