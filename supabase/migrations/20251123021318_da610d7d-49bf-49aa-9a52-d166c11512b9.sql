-- Add 'person' to interest_kind enum
ALTER TYPE interest_kind ADD VALUE IF NOT EXISTS 'person';

-- Update the validation trigger to include person validation
CREATE OR REPLACE FUNCTION public.validate_subscriber_interest_fk()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate subject_id exists in the appropriate table based on kind
    IF NEW.kind = 'league' THEN
        IF NOT EXISTS (SELECT 1 FROM leagues WHERE id = NEW.subject_id) THEN
            RAISE EXCEPTION 'Invalid subject_id: league with id % does not exist', NEW.subject_id;
        END IF;
    ELSIF NEW.kind = 'team' THEN
        IF NOT EXISTS (SELECT 1 FROM teams WHERE id = NEW.subject_id) THEN
            RAISE EXCEPTION 'Invalid subject_id: team with id % does not exist', NEW.subject_id;
        END IF;
    ELSIF NEW.kind = 'sport' THEN
        IF NOT EXISTS (SELECT 1 FROM sports WHERE id = NEW.subject_id) THEN
            RAISE EXCEPTION 'Invalid subject_id: sport with id % does not exist', NEW.subject_id;
        END IF;
    ELSIF NEW.kind = 'person' THEN
        -- NEW: Validate person_id
        IF NOT EXISTS (SELECT 1 FROM people WHERE id = NEW.subject_id AND is_active = true) THEN
            RAISE EXCEPTION 'Invalid subject_id: person with id % does not exist or is not active', NEW.subject_id;
        END IF;
    ELSE
        RAISE EXCEPTION 'Unknown kind: %', NEW.kind;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update get_subscriber_feed to include person filtering
CREATE OR REPLACE FUNCTION public.get_subscriber_feed(
  p_subscriber_id uuid,
  p_since timestamp with time zone DEFAULT (now() - '7 days'::interval),
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
STABLE SECURITY DEFINER
AS $$
  select a.id, a.title, a.url, a.thumbnail_url, a.domain,
         greatest(a.published_at, a.updated_at) as published_effective,
         a.published_at, a.updated_at
  from public.articles a
  where greatest(a.published_at, a.updated_at) >= coalesce(p_since, now() - interval '7 days')
    and (
      exists (
        select 1
        from public.subscriber_interests si
        where si.subscriber_id = p_subscriber_id
          and si.kind = 'team'
          and exists (
            select 1 from public.article_team_map atm
            where atm.article_id = a.id and atm.team_id = si.subject_id
          )
      )
      or
      exists (
        select 1
        from public.subscriber_interests si
        where si.subscriber_id = p_subscriber_id
          and si.kind = 'league'
          and exists (
            select 1 from public.article_league_map alm
            where alm.article_id = a.id and alm.league_id = si.subject_id
          )
      )
      or
      exists (
        select 1
        from public.subscriber_interests si
        where si.subscriber_id = p_subscriber_id
          and si.kind = 'sport'
          and exists (
            select 1 from public.article_sport_map asm
            where asm.article_id = a.id and asm.sport_id = si.subject_id
          )
      )
      or
      exists (
        select 1
        from public.subscriber_interests si
        where si.subscriber_id = p_subscriber_id
          and si.kind = 'person'
          and exists (
            select 1 from public.article_person_map apm
            where apm.article_id = a.id and apm.person_id = si.subject_id
          )
      )
    )
    and (
      p_cursor_time is null
      or (greatest(a.published_at, a.updated_at), a.id) < (p_cursor_time, p_cursor_id)
    )
  order by published_effective desc, a.id desc
  limit least(coalesce(p_limit, 50), 200);
$$;