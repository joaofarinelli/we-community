-- Fix the trigger function to handle created_by properly when creating default space category
DROP TRIGGER IF EXISTS create_default_space_category_trigger ON public.companies;
DROP FUNCTION IF EXISTS public.create_default_space_category();

-- Create improved function that gets the creator properly
CREATE OR REPLACE FUNCTION public.create_default_space_category()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  creator_user_id uuid;
BEGIN
  -- First try to get the owner from profiles
  SELECT user_id INTO creator_user_id
  FROM public.profiles 
  WHERE company_id = NEW.id AND role = 'owner' 
  LIMIT 1;
  
  -- If no owner found yet (during company creation), use auth.uid()
  IF creator_user_id IS NULL THEN
    creator_user_id := auth.uid();
  END IF;
  
  -- Only create if we have a valid creator
  IF creator_user_id IS NOT NULL THEN
    INSERT INTO public.space_categories (company_id, name, order_index, created_by)
    VALUES (NEW.id, 'Espaços', 0, creator_user_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER create_default_space_category_trigger
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_space_category();

-- Also fix the companies creation to ensure we create a profile for the creator
CREATE OR REPLACE FUNCTION public.create_company_with_owner(
  p_company_data jsonb,
  p_owner_email text DEFAULT NULL
)
RETURNS uuid
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_company_id uuid;
  owner_user_id uuid;
  owner_email text;
BEGIN
  -- Get the current user ID
  owner_user_id := auth.uid();
  
  -- Use provided email or get from auth
  IF p_owner_email IS NOT NULL THEN
    owner_email := p_owner_email;
  ELSE
    SELECT email INTO owner_email FROM auth.users WHERE id = owner_user_id;
  END IF;
  
  -- Create the company
  INSERT INTO public.companies (
    name, subdomain, custom_domain, plan, status, phone, address, city, state, postal_code, cnpj
  )
  SELECT 
    p_company_data->>'name',
    p_company_data->>'subdomain',
    p_company_data->>'custom_domain',
    COALESCE(p_company_data->>'plan', 'free'),
    COALESCE(p_company_data->>'status', 'active'),
    p_company_data->>'phone',
    p_company_data->>'address',
    p_company_data->>'city',
    p_company_data->>'state',
    p_company_data->>'postal_code',
    p_company_data->>'cnpj'
  RETURNING id INTO new_company_id;
  
  -- Create owner profile
  INSERT INTO public.profiles (user_id, company_id, email, role, first_name, last_name, is_active)
  VALUES (
    owner_user_id, 
    new_company_id, 
    owner_email, 
    'owner',
    COALESCE(split_part(owner_email, '@', 1), 'Super'),
    'Admin',
    true
  );
  
  RETURN new_company_id;
END;
$$;