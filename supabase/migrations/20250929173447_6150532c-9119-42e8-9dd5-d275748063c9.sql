-- Adicionar coluna is_public à tabela custom_profile_fields
ALTER TABLE public.custom_profile_fields 
ADD COLUMN is_public boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.custom_profile_fields.is_public IS 
'Define se este campo personalizado é visível para outros usuários por padrão';

-- Atualizar policy para permitir usuários verem campos públicos de outros usuários
CREATE POLICY "Users can view public custom fields of other users"
ON public.user_custom_profile_data
FOR SELECT
USING (
  company_id = get_user_company_id() 
  AND (
    user_id = auth.uid() -- Próprio usuário vê tudo
    OR EXISTS ( -- Campos públicos visíveis para todos
      SELECT 1 FROM custom_profile_fields cpf
      WHERE cpf.id = user_custom_profile_data.field_id
      AND cpf.is_public = true
      AND cpf.is_active = true
    )
    OR is_company_admin() -- Admins veem tudo
  )
);