-- Create the can_user_see_space function that's referenced in RLS policies but missing
CREATE OR REPLACE FUNCTION public.can_user_see_space(p_space_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_company_id uuid;
  space_visibility text;
  space_company_id uuid;
  is_space_member boolean := false;
BEGIN
  -- Get user's company ID
  user_company_id := public.get_user_company_id();
  
  IF user_company_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get space details
  SELECT s.visibility, s.company_id
  INTO space_visibility, space_company_id
  FROM public.spaces s
  WHERE s.id = p_space_id;
  
  -- Space must belong to user's company
  IF space_company_id != user_company_id THEN
    RETURN false;
  END IF;
  
  -- If space is public, user can see it
  IF space_visibility = 'public' THEN
    RETURN true;
  END IF;
  
  -- If space is private, check if user is a member
  SELECT EXISTS (
    SELECT 1 FROM public.space_members sm
    WHERE sm.space_id = p_space_id AND sm.user_id = p_user_id
  ) INTO is_space_member;
  
  RETURN is_space_member;
END;
$function$;

-- Drop the incorrect DELETE policy that was meant for SELECT
DROP POLICY IF EXISTS "Users can view comments on accessible events" ON public.events;

-- Create the proper SELECT policy for events
CREATE POLICY "Users can view events in accessible spaces" ON public.events
FOR SELECT 
USING (
  company_id = get_user_company_id() 
  AND can_user_see_space(space_id, auth.uid())
);

-- Ensure the existing management policy is correct
DROP POLICY IF EXISTS "Space admins can manage events" ON public.events;
CREATE POLICY "Space admins can manage events" ON public.events
FOR ALL 
USING (
  company_id = get_user_company_id() 
  AND (
    is_company_admin() 
    OR EXISTS (
      SELECT 1 FROM space_members sm
      WHERE sm.space_id = events.space_id 
      AND sm.user_id = auth.uid() 
      AND sm.role = 'admin'
    )
  )
);

-- Create missing policies for event management by space admins and company admins
CREATE POLICY "Space admins can create events" ON public.events
FOR INSERT 
WITH CHECK (
  company_id = get_user_company_id() 
  AND (
    is_company_admin() 
    OR EXISTS (
      SELECT 1 FROM space_members sm
      WHERE sm.space_id = events.space_id 
      AND sm.user_id = auth.uid() 
      AND sm.role = 'admin'
    )
  )
  AND auth.uid() = created_by
);

CREATE POLICY "Space admins can update events" ON public.events
FOR UPDATE 
USING (
  company_id = get_user_company_id() 
  AND (
    is_company_admin() 
    OR EXISTS (
      SELECT 1 FROM space_members sm
      WHERE sm.space_id = events.space_id 
      AND sm.user_id = auth.uid() 
      AND sm.role = 'admin'
    )
  )
);

CREATE POLICY "Space admins can delete events" ON public.events
FOR DELETE 
USING (
  company_id = get_user_company_id() 
  AND (
    is_company_admin() 
    OR EXISTS (
      SELECT 1 FROM space_members sm
      WHERE sm.space_id = events.space_id 
      AND sm.user_id = auth.uid() 
      AND sm.role = 'admin'
    )
  )
);