-- Update RLS policies for events table to allow admins/owners to edit events

-- Drop existing policies for UPDATE on events
DROP POLICY IF EXISTS "Space admins can update events" ON public.events;

-- Create new policy that allows space admins AND company owners to update events
CREATE POLICY "Space admins and company owners can update events" 
ON public.events 
FOR UPDATE 
USING (
  company_id = get_user_company_id() 
  AND (
    -- Company owners can update all events
    is_company_owner() 
    OR 
    -- Space admins can update events in their spaces
    EXISTS (
      SELECT 1 
      FROM space_members sm 
      WHERE sm.space_id = events.space_id 
      AND sm.user_id = auth.uid() 
      AND sm.role = 'admin'
    )
    OR
    -- Event creator can update their own events
    created_by = auth.uid()
  )
);

-- Also update DELETE policy for consistency
DROP POLICY IF EXISTS "Space admins can delete events" ON public.events;

CREATE POLICY "Space admins and company owners can delete events" 
ON public.events 
FOR DELETE 
USING (
  company_id = get_user_company_id() 
  AND (
    -- Company owners can delete all events
    is_company_owner() 
    OR 
    -- Space admins can delete events in their spaces
    EXISTS (
      SELECT 1 
      FROM space_members sm 
      WHERE sm.space_id = events.space_id 
      AND sm.user_id = auth.uid() 
      AND sm.role = 'admin'
    )
    OR
    -- Event creator can delete their own events
    created_by = auth.uid()
  )
);