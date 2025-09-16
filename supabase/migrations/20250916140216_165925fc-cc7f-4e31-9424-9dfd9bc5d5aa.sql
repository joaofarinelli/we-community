-- First drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view events in accessible spaces" ON public.events;
DROP POLICY IF EXISTS "Space admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Space admins can update events" ON public.events;
DROP POLICY IF EXISTS "Space admins can delete events" ON public.events;
DROP POLICY IF EXISTS "Users can view spaces they have access to" ON public.spaces;
DROP POLICY IF EXISTS "Users can view non-hidden posts in accessible spaces" ON public.posts;
DROP POLICY IF EXISTS "Users can view interactions on accessible posts" ON public.post_interactions;
DROP POLICY IF EXISTS "Users can view event likes for accessible events" ON public.event_likes;
DROP POLICY IF EXISTS "Users can view comments on accessible events" ON public.event_comments;

-- Update can_user_see_space to use correct company context and include group access
DROP FUNCTION IF EXISTS public.can_user_see_space(uuid, uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.can_user_see_space(p_space_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM spaces s
    WHERE s.id = p_space_id
      AND s.company_id = get_user_company_id()
      AND (
        s.visibility = 'public'
        OR EXISTS (
          SELECT 1
          FROM space_members sm
          WHERE sm.space_id = p_space_id
            AND sm.user_id = p_user_id
        )
        OR EXISTS (
          SELECT 1
          FROM access_group_spaces ags
          JOIN access_group_members agm
            ON agm.access_group_id = ags.access_group_id
          WHERE ags.space_id = p_space_id
            AND agm.user_id = p_user_id
            AND agm.company_id = get_user_company_id()
        )
      )
  );
$function$;

GRANT EXECUTE ON FUNCTION public.can_user_see_space(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_see_space(uuid, uuid) TO anon;

-- Recreate the essential policies

-- Events table policies
CREATE POLICY "Users can view events in accessible spaces" ON public.events
FOR SELECT 
USING (
  company_id = get_user_company_id() 
  AND can_user_see_space(space_id, auth.uid())
);

CREATE POLICY "Space admins can insert events" ON public.events
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

-- Spaces table policy
CREATE POLICY "Users can view spaces they have access to" ON public.spaces
FOR SELECT 
USING (
  company_id = get_user_company_id() 
  AND can_user_see_space(id, auth.uid())
);

-- Posts table policy
CREATE POLICY "Users can view non-hidden posts in accessible spaces" ON public.posts
FOR SELECT 
USING (
  company_id = get_user_company_id() 
  AND (is_hidden = false OR author_id = auth.uid())
  AND can_user_see_space(space_id, auth.uid())
);

-- Post interactions policy
CREATE POLICY "Users can view interactions on accessible posts" ON public.post_interactions
FOR SELECT 
USING (
  company_id = get_user_company_id() 
  AND EXISTS (
    SELECT 1 FROM posts p 
    WHERE p.id = post_interactions.post_id 
    AND can_user_see_space(p.space_id, auth.uid())
  )
);

-- Event likes policy
CREATE POLICY "Users can view event likes for accessible events" ON public.event_likes
FOR SELECT 
USING (
  company_id = get_user_company_id() 
  AND EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_likes.event_id 
    AND can_user_see_space(e.space_id, auth.uid())
  )
);

-- Event comments policy
CREATE POLICY "Users can view comments on accessible events" ON public.event_comments  
FOR SELECT
USING (
  company_id = get_user_company_id() 
  AND EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_comments.event_id 
    AND can_user_see_space(e.space_id, auth.uid())
  )
);