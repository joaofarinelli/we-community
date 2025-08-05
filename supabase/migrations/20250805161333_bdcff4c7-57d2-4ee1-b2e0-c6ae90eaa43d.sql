-- Fix can_user_see_space function for multi-company users
CREATE OR REPLACE FUNCTION public.can_user_see_space(space_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  space_visibility text;
  space_company_id uuid;
  user_company_id uuid;
  is_company_owner boolean;
  has_access_group_permission boolean := false;
BEGIN
  -- Get space visibility and company
  SELECT visibility, company_id INTO space_visibility, space_company_id
  FROM public.spaces WHERE id = space_id;
  
  -- Get user's company context from the current session
  user_company_id := public.get_user_company_id();
  
  -- If no company context, try to find user's company for this space's company
  IF user_company_id IS NULL THEN
    SELECT company_id INTO user_company_id
    FROM public.profiles 
    WHERE profiles.user_id = can_user_see_space.user_id 
    AND company_id = space_company_id
    AND is_active = true
    LIMIT 1;
  END IF;
  
  -- Different companies cannot see each other's spaces
  IF space_company_id != user_company_id THEN
    RETURN false;
  END IF;
  
  -- Check if user is company owner for this specific company
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = can_user_see_space.user_id 
    AND company_id = user_company_id 
    AND role IN ('owner', 'admin')
    AND is_active = true
  ) INTO is_company_owner;
  
  -- Company owners/admins can see all spaces
  IF is_company_owner THEN
    RETURN true;
  END IF;
  
  -- Public spaces are visible to everyone in the company
  IF space_visibility = 'public' THEN
    RETURN true;
  END IF;
  
  -- For private and secret spaces, check membership OR access groups
  IF space_visibility IN ('private', 'secret') THEN
    -- Check direct space membership
    IF public.is_space_member(space_id, user_id) THEN
      RETURN true;
    END IF;
    
    -- Check access groups - user is member of a group that has access to this space
    SELECT EXISTS (
      SELECT 1 
      FROM public.access_group_members agm
      JOIN public.access_group_spaces ags ON agm.access_group_id = ags.access_group_id
      WHERE agm.user_id = can_user_see_space.user_id 
        AND ags.space_id = can_user_see_space.space_id
        AND agm.company_id = user_company_id
        AND ags.company_id = user_company_id
    ) INTO has_access_group_permission;
    
    RETURN has_access_group_permission;
  END IF;
  
  RETURN false;
END;
$function$;