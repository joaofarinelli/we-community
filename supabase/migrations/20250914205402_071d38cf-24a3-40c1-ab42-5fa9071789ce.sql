-- Criar funções RPC para verificar completude de módulos e cursos

-- Função para verificar se um módulo foi completado por um usuário
CREATE OR REPLACE FUNCTION public.check_module_completion(
  p_user_id uuid,
  p_module_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  total_lessons integer;
  completed_lessons integer;
BEGIN
  -- Contar total de lições no módulo
  SELECT COUNT(*) INTO total_lessons
  FROM course_lessons
  WHERE module_id = p_module_id;
  
  -- Se não há lições, considerar módulo como não completado
  IF total_lessons = 0 THEN
    RETURN false;
  END IF;
  
  -- Contar lições completadas pelo usuário
  SELECT COUNT(*) INTO completed_lessons
  FROM user_course_progress ucp
  JOIN course_lessons cl ON cl.id = ucp.lesson_id
  WHERE cl.module_id = p_module_id
    AND ucp.user_id = p_user_id
    AND ucp.completed_at IS NOT NULL;
  
  -- Módulo está completo se todas as lições foram completadas
  RETURN completed_lessons >= total_lessons;
END;
$$;

-- Função para verificar se um curso foi completado por um usuário
CREATE OR REPLACE FUNCTION public.check_course_completion(
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
  module_record RECORD;
BEGIN
  -- Verificar se todos os módulos do curso estão completos
  FOR module_record IN 
    SELECT id FROM course_modules 
    WHERE course_id = p_course_id 
    ORDER BY order_index
  LOOP
    -- Se qualquer módulo não estiver completo, o curso não está completo
    IF NOT public.check_module_completion(p_user_id, module_record.id) THEN
      RETURN false;
    END IF;
  END LOOP;
  
  -- Se chegou até aqui, todos os módulos estão completos
  RETURN true;
END;
$$;

-- Função para obter resumo de progresso de cursos do usuário
CREATE OR REPLACE FUNCTION public.get_user_course_progress_summary(
  p_user_id uuid,
  p_company_id uuid
)
RETURNS TABLE(
  course_id uuid,
  course_title text,
  total_lessons bigint,
  completed_lessons bigint,
  progress_percent numeric,
  is_completed boolean,
  certificate_issued boolean,
  certificate_code text,
  certificate_issued_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as course_id,
    c.title as course_title,
    COALESCE(lesson_counts.total_lessons, 0) as total_lessons,
    COALESCE(progress_counts.completed_lessons, 0) as completed_lessons,
    CASE 
      WHEN COALESCE(lesson_counts.total_lessons, 0) = 0 THEN 0
      ELSE ROUND((COALESCE(progress_counts.completed_lessons, 0)::numeric / lesson_counts.total_lessons::numeric) * 100, 1)
    END as progress_percent,
    public.check_course_completion(p_user_id, c.id) as is_completed,
    COALESCE(cert.certificate_issued, false) as certificate_issued,
    cert.certificate_code,
    cert.certificate_issued_at
  FROM courses c
  LEFT JOIN (
    SELECT 
      cm.course_id,
      COUNT(cl.id) as total_lessons
    FROM course_modules cm
    JOIN course_lessons cl ON cl.module_id = cm.id
    GROUP BY cm.course_id
  ) lesson_counts ON lesson_counts.course_id = c.id
  LEFT JOIN (
    SELECT 
      cm.course_id,
      COUNT(ucp.id) as completed_lessons
    FROM course_modules cm
    JOIN course_lessons cl ON cl.module_id = cm.id
    JOIN user_course_progress ucp ON ucp.lesson_id = cl.id
    WHERE ucp.user_id = p_user_id AND ucp.completed_at IS NOT NULL
    GROUP BY cm.course_id
  ) progress_counts ON progress_counts.course_id = c.id
  LEFT JOIN user_certificates cert ON cert.user_id = p_user_id AND cert.course_id = c.id
  WHERE c.company_id = p_company_id 
    AND c.is_active = true
    AND public.user_has_course_access(p_user_id, c.id)
  ORDER BY c.order_index, c.created_at;
END;
$$;

-- Definir ownership das funções
ALTER FUNCTION public.check_module_completion(uuid, uuid) OWNER TO postgres;
ALTER FUNCTION public.check_course_completion(uuid, uuid) OWNER TO postgres;
ALTER FUNCTION public.get_user_course_progress_summary(uuid, uuid) OWNER TO postgres;