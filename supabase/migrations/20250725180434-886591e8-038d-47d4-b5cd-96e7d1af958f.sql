-- Function to add a user to all public spaces in their company
CREATE OR REPLACE FUNCTION public.add_user_to_public_spaces(p_user_id uuid, p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Add user to all public spaces in the company where they're not already a member
  INSERT INTO public.space_members (space_id, user_id, role)
  SELECT s.id, p_user_id, 'member'
  FROM public.spaces s
  WHERE s.company_id = p_company_id
    AND s.visibility = 'public'
    AND NOT EXISTS (
      SELECT 1 FROM public.space_members sm 
      WHERE sm.space_id = s.id AND sm.user_id = p_user_id
    );
END;
$function$;

-- Trigger function to automatically add new users to public spaces
CREATE OR REPLACE FUNCTION public.handle_new_user_public_spaces()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Add the new user to all public spaces in their company
  PERFORM public.add_user_to_public_spaces(NEW.user_id, NEW.company_id);
  RETURN NEW;
END;
$function$;

-- Create trigger to execute when a new profile is created
CREATE TRIGGER on_profile_created_add_to_public_spaces
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_public_spaces();

-- One-time function to add existing users to public spaces
CREATE OR REPLACE FUNCTION public.add_existing_users_to_public_spaces()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  profile_record RECORD;
BEGIN
  -- Loop through all existing profiles
  FOR profile_record IN 
    SELECT user_id, company_id FROM public.profiles
  LOOP
    -- Add each user to public spaces in their company
    PERFORM public.add_user_to_public_spaces(profile_record.user_id, profile_record.company_id);
  END LOOP;
END;
$function$;

-- Execute the one-time function to add existing users
SELECT public.add_existing_users_to_public_spaces();