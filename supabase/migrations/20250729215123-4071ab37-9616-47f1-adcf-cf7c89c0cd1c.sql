-- Update RLS policy for event participants to allow joining events in accessible spaces
-- (not just spaces where user is a member)

DROP POLICY IF EXISTS "Users can join events in accessible spaces" ON public.event_participants;

CREATE POLICY "Users can join events in accessible spaces" 
ON public.event_participants 
FOR INSERT 
WITH CHECK (
  company_id = get_user_company_id() 
  AND user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM events e 
    WHERE e.id = event_participants.event_id 
    AND can_user_see_space(e.space_id, auth.uid())
  )
);