-- Fix the can_user_see_space function to properly bypass RLS
DROP FUNCTION IF EXISTS public.can_user_see_space(uuid, uuid);

-- Create a simplified function that works reliably with RLS
CREATE OR REPLACE FUNCTION public.can_user_see_space(p_space_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM spaces s
    WHERE s.id = p_space_id
    AND s.company_id = (
      SELECT company_id FROM profiles 
      WHERE user_id = p_user_id AND is_active = true 
      LIMIT 1
    )
    AND (
      s.visibility = 'public'
      OR EXISTS (
        SELECT 1 FROM space_members sm
        WHERE sm.space_id = p_space_id AND sm.user_id = p_user_id
      )
    )
  );
$function$;

-- Grant necessary permissions to the function
GRANT EXECUTE ON FUNCTION public.can_user_see_space(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_see_space(uuid, uuid) TO anon;