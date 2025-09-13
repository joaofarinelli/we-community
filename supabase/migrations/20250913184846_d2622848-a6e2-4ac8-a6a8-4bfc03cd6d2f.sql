-- Fix NULL token issues in auth.users table that cause 500 errors during password reset

-- First, replace NULL values with empty strings for existing users
UPDATE auth.users 
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, '')
WHERE 
  confirmation_token IS NULL 
  OR recovery_token IS NULL 
  OR email_change_token_new IS NULL;

-- Then set the columns to NOT NULL with default empty string to prevent future issues
ALTER TABLE auth.users 
ALTER COLUMN confirmation_token SET DEFAULT '',
ALTER COLUMN confirmation_token SET NOT NULL;

ALTER TABLE auth.users 
ALTER COLUMN recovery_token SET DEFAULT '',
ALTER COLUMN recovery_token SET NOT NULL;

ALTER TABLE auth.users 
ALTER COLUMN email_change_token_new SET DEFAULT '',
ALTER COLUMN email_change_token_new SET NOT NULL;