-- Update the interest_kind enum to include 'sport' and 'league'
-- First, add the new values to the enum
ALTER TYPE interest_kind ADD VALUE IF NOT EXISTS 'sport';
ALTER TYPE interest_kind ADD VALUE IF NOT EXISTS 'league';