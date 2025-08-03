-- Remove unique constraint from user_id alone if it exists
-- and ensure we have unique constraint on (user_id, company_id) combination

-- First, let's check and drop any existing unique constraint on user_id alone
DO $$ 
BEGIN
    -- Drop unique constraint on user_id if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_user_id_key' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_user_id_key;
    END IF;
END $$;

-- Ensure we have the correct unique constraint on (user_id, company_id)
DO $$
BEGIN
    -- Add unique constraint on (user_id, company_id) if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_user_id_company_id_key' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_user_id_company_id_key 
        UNIQUE (user_id, company_id);
    END IF;
END $$;