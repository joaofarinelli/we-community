-- Let's check current policies and create a simplified one for debugging
-- First, list current policies
SELECT pol.schemaname, pol.tablename, pol.policyname, pol.cmd, pol.qual, pol.with_check
FROM pg_policies pol 
WHERE pol.tablename = 'event_participants';

-- Create a more permissive temporary policy for debugging
DROP POLICY IF EXISTS "Users can join events in accessible spaces" ON public.event_participants;

-- Simplified policy - just check basic requirements
CREATE POLICY "Users can join events" 
ON public.event_participants 
FOR INSERT 
WITH CHECK (
  company_id = get_user_company_id() 
  AND user_id = auth.uid()
);