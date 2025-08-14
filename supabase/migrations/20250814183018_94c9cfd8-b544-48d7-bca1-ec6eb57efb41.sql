-- Allow edge functions to create invites by bypassing RLS for service role
-- First, let's add a policy that allows the service role to insert invites
CREATE POLICY "Service role can create invites" 
ON public.user_invites 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Also allow service role to read invites for validation
CREATE POLICY "Service role can read invites" 
ON public.user_invites 
FOR SELECT 
TO service_role
USING (true);