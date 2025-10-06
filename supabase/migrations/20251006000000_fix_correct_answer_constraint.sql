-- Fix valid_correct_answer constraint to accept 5 options (a, b, c, d, e)
-- This is needed because some PAES questions (especially History) have 5 alternatives

-- Drop the old constraint that only accepts a, b, c, d
ALTER TABLE questions DROP CONSTRAINT IF EXISTS valid_correct_answer;

-- Add new constraint that accepts a, b, c, d, e
ALTER TABLE questions ADD CONSTRAINT valid_correct_answer
CHECK (correct_answer IN ('a', 'b', 'c', 'd', 'e'));

-- Add comment explaining the change
COMMENT ON CONSTRAINT valid_correct_answer ON questions IS
'Validates that correct_answer is one of the possible option labels (a-e). History questions can have 5 options while Math questions typically have 4.';
