-- Corrigir recursão em RLS na política de SELECT de courses
-- Recria user_has_course_access como SECURITY DEFINER e search_path fixo
CREATE OR REPLACE FUNCTION public.user_has_course_access(
  p_user_id uuid,
  p_course_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  course_company_id uuid;
  has_profile boolean;
BEGIN
  -- Buscar a empresa do curso sem sofrer RLS
  SELECT company_id INTO course_company_id
  FROM public.courses 
  WHERE id = p_course_id;
  
  IF course_company_id IS NULL THEN
    RETURN false;
  END IF;

  -- Usuário precisa ter perfil ativo nessa empresa
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = p_user_id 
      AND company_id = course_company_id 
      AND is_active = true
  ) INTO has_profile;

  IF NOT has_profile THEN
    RETURN false;
  END IF;

  -- Owners/Admins têm acesso a todos os cursos da empresa
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = p_user_id 
      AND company_id = course_company_id 
      AND role IN ('owner','admin')
      AND is_active = true
  ) THEN
    RETURN true;
  END IF;

  -- Membros precisam de acesso explícito
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_course_access 
    WHERE user_id = p_user_id 
      AND course_id = p_course_id 
      AND company_id = course_company_id
  );
END;
$$;

ALTER FUNCTION public.user_has_course_access(uuid, uuid) OWNER TO postgres;