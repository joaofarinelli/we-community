-- Fix the trigger function by dropping with CASCADE first
DROP TRIGGER IF EXISTS create_default_category_on_company_creation ON public.companies CASCADE;
DROP FUNCTION IF EXISTS public.create_default_space_category() CASCADE;

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