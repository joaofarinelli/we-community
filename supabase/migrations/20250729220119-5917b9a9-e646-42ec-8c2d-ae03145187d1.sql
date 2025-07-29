-- Remove all existing policies on event_participants
DROP POLICY IF EXISTS "Users can join events in accessible spaces" ON public.event_participants;
DROP POLICY IF EXISTS "Users can leave events" ON public.event_participants;
DROP POLICY IF EXISTS "Users can view participants in accessible events" ON public.event_participants;
DROP POLICY IF EXISTS "Users can join events" ON public.event_participants;

-- Create very simple policies that should work
CREATE POLICY "Users can manage their own participation" 
ON public.event_participants 
FOR ALL 
USING (user_id = auth.uid() AND company_id = get_user_company_id())
WITH CHECK (user_id = auth.uid() AND company_id = get_user_company_id());

CREATE POLICY "Users can view all participants in their company" 
ON public.event_participants 
FOR SELECT 
USING (company_id = get_user_company_id());