-- Melhorar a função is_company_owner para incluir verificação de contexto da empresa
CREATE OR REPLACE FUNCTION public.is_company_owner()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_company_id uuid;
BEGIN
    -- Obter o ID da empresa do usuário
    user_company_id := get_user_company_id();
    
    IF user_company_id IS NULL THEN
        RAISE LOG 'is_company_owner: No company context found for user %', auth.uid();
        RETURN FALSE;
    END IF;
    
    -- Verificar se o usuário é owner da empresa atual
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND company_id = user_company_id
        AND role = 'owner'
        AND is_active = true
    );
END;
$$;

-- Adicionar função auxiliar para debug de criação de espaços
CREATE OR REPLACE FUNCTION public.debug_space_creation_context()
RETURNS TABLE (
    auth_user_id uuid,
    company_context uuid,
    is_owner boolean,
    profile_exists boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        auth.uid() as auth_user_id,
        get_user_company_id() as company_context,
        is_company_owner() as is_owner,
        EXISTS(
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND company_id = get_user_company_id()
            AND is_active = true
        ) as profile_exists;
END;
$$;