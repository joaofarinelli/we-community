-- Corrigir políticas RLS com recursão infinita no conversation_participants
-- Primeiro, dropar a política problemática
DROP POLICY IF EXISTS "Users can view participants in conversations they're part of" ON public.conversation_participants;

-- Criar uma política mais simples para conversation_participants
CREATE POLICY "Users can view conversation participants" 
ON public.conversation_participants 
FOR SELECT 
USING (
  company_id = get_user_company_id()
);

-- Melhorar política de perfis para evitar 406 errors
DROP POLICY IF EXISTS "Public can query profiles by email and company for login validation" ON public.profiles;

-- Criar política mais específica para perfis
CREATE POLICY "Users can query profiles for authentication and company access" 
ON public.profiles 
FOR SELECT 
USING (
  -- Allow access to own profile or profiles in same company
  user_id = auth.uid() OR 
  company_id = get_user_company_id() OR
  -- Allow public access for login validation
  auth.role() = 'anon'
);