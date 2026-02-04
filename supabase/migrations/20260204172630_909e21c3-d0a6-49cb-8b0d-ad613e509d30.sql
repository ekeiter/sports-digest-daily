-- Function to expand a sport_id to include all children (parent + descendants)
CREATE OR REPLACE FUNCTION public.get_sport_with_children(p_sport_id INT)
RETURNS INT[] AS $$
    SELECT ARRAY(
        SELECT id FROM sports 
        WHERE id = p_sport_id OR parent_id = p_sport_id
    );
$$ LANGUAGE sql STABLE;