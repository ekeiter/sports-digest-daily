-- Update the validate_subscriber_interest_fk function to handle 'league' kind
CREATE OR REPLACE FUNCTION public.validate_subscriber_interest_fk()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
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
    ELSE
        RAISE EXCEPTION 'Unknown kind: %', NEW.kind;
    END IF;
    
    RETURN NEW;
END;
$function$;