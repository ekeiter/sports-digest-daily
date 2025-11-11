-- Update toggle_subscriber_interest function to handle new interest_kind enum
CREATE OR REPLACE FUNCTION toggle_subscriber_interest(
  p_kind interest_kind,
  p_subject_id bigint
) RETURNS boolean AS $$
DECLARE
  v_subscriber_id uuid;
  v_exists boolean;
BEGIN
  -- Get current user
  v_subscriber_id := auth.uid();
  
  IF v_subscriber_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if interest already exists
  SELECT EXISTS(
    SELECT 1 FROM subscriber_interests
    WHERE subscriber_id = v_subscriber_id
    AND kind = p_kind
    AND subject_id = p_subject_id
  ) INTO v_exists;

  IF v_exists THEN
    -- Remove the interest
    DELETE FROM subscriber_interests
    WHERE subscriber_id = v_subscriber_id
    AND kind = p_kind
    AND subject_id = p_subject_id;
    
    RETURN false; -- Indicates unfollowed
  ELSE
    -- Add the interest
    INSERT INTO subscriber_interests (subscriber_id, kind, subject_id)
    VALUES (v_subscriber_id, p_kind, p_subject_id);
    
    RETURN true; -- Indicates followed
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;