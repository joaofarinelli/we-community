-- Enable multiple profiles per user (one per company)
-- Remove the current unique constraint on user_id and add one for (user_id, company_id)

-- First, let's check if there are any existing unique constraints on user_id
-- and remove them if they exist
DO $$ 
BEGIN
    -- Drop existing unique constraint on user_id if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%user_id%' 
        AND table_name = 'profiles' 
        AND constraint_type = 'UNIQUE'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_user_id_key;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Constraint might not exist, continue
        NULL;
END $$;

-- Add unique constraint for (user_id, company_id) to prevent duplicate profiles per company
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_company_id_unique UNIQUE (user_id, company_id);

-- Create function to get user's profile for current company context
CREATE OR REPLACE FUNCTION public.get_user_profile_for_company(p_user_id uuid, p_company_id uuid)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    company_id uuid,
    first_name text,
    last_name text,
    email text,
    phone text,
    role text,
    is_active boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.user_id, p.company_id, p.first_name, p.last_name, 
           p.email, p.phone, p.role, p.is_active, p.created_at, p.updated_at
    FROM public.profiles p
    WHERE p.user_id = p_user_id AND p.company_id = p_company_id;
END;
$$;

-- Create function to list all companies a user has profiles in
CREATE OR REPLACE FUNCTION public.get_user_companies(p_user_id uuid)
RETURNS TABLE (
    company_id uuid,
    company_name text,
    company_subdomain text,
    company_custom_domain text,
    user_role text,
    profile_created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.name, c.subdomain, c.custom_domain, p.role, p.created_at
    FROM public.profiles p
    JOIN public.companies c ON c.id = p.company_id
    WHERE p.user_id = p_user_id AND p.is_active = true
    ORDER BY p.created_at DESC;
END;
$$;

-- Update get_user_company_id function to work with company context
-- This will now require the company_id to be passed or inferred from context
CREATE OR REPLACE FUNCTION public.get_user_company_id_for_context(p_company_id uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    result_company_id uuid;
BEGIN
    -- If company_id is provided, verify user has profile in that company
    IF p_company_id IS NOT NULL THEN
        SELECT company_id INTO result_company_id
        FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND company_id = p_company_id 
        AND is_active = true;
        
        IF result_company_id IS NOT NULL THEN
            RETURN result_company_id;
        END IF;
    END IF;
    
    -- Fallback: return the first company the user has access to
    SELECT company_id INTO result_company_id
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND is_active = true
    ORDER BY created_at ASC
    LIMIT 1;
    
    RETURN result_company_id;
END;
$$;

-- Function to create a new profile for a user in a company
CREATE OR REPLACE FUNCTION public.create_user_profile_for_company(
    p_user_id uuid,
    p_company_id uuid,
    p_first_name text,
    p_last_name text,
    p_email text DEFAULT NULL,
    p_role text DEFAULT 'member'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    new_profile_id uuid;
BEGIN
    -- Check if profile already exists
    IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = p_user_id AND company_id = p_company_id
    ) THEN
        RAISE EXCEPTION 'User already has a profile in this company';
    END IF;
    
    -- Create new profile
    INSERT INTO public.profiles (
        user_id, company_id, first_name, last_name, email, role, is_active
    ) VALUES (
        p_user_id, p_company_id, p_first_name, p_last_name, p_email, p_role, true
    ) RETURNING id INTO new_profile_id;
    
    -- Add user to public spaces in the company
    PERFORM public.add_user_to_public_spaces(p_user_id, p_company_id);
    
    RETURN new_profile_id;
END;
$$;