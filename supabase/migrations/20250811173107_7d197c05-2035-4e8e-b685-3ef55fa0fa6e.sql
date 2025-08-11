
-- 1) Habilitar certificado e dados do mentor no curso
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS certificate_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mentor_name text,
  ADD COLUMN IF NOT EXISTS mentor_role text,
  ADD COLUMN IF NOT EXISTS mentor_signature_url text,
  ADD COLUMN IF NOT EXISTS certificate_background_url text,
  ADD COLUMN IF NOT EXISTS certificate_footer_text text;

-- 2) Tabela de certificados de curso por usuária
CREATE TABLE IF NOT EXISTS public.user_course_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  course_id uuid NOT NULL,
  course_title text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 0,
  certificate_code text NOT NULL UNIQUE,
  mentor_name text,
  mentor_role text,
  mentor_signature_url text,
  issued_by uuid,
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Trigger de updated_at
DROP TRIGGER IF EXISTS set_timestamp_user_course_certificates ON public.user_course_certificates;
CREATE TRIGGER set_timestamp_user_course_certificates
BEFORE UPDATE ON public.user_course_certificates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Ativar RLS e políticas
ALTER TABLE public.user_course_certificates ENABLE ROW LEVEL SECURITY;

-- Usuárias veem os próprios certificados na empresa corrente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='user_course_certificates'
      AND policyname='Users can view their own certificates'
  ) THEN
    CREATE POLICY "Users can view their own certificates"
      ON public.user_course_certificates
      FOR SELECT
      USING (
        company_id = public.get_user_company_id()
        AND user_id = auth.uid()
      );
  END IF;
END$$;

-- Donas/admins veem todos na empresa atual
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='user_course_certificates'
      AND policyname='Company owners can view all certificates'
  ) THEN
    CREATE POLICY "Company owners can view all certificates"
      ON public.user_course_certificates
      FOR SELECT
      USING (
        company_id = public.get_user_company_id()
        AND public.is_company_owner()
      );
  END IF;
END$$;

-- Sem INSERT/UPDATE/DELETE diretos pelo cliente (apenas via RPC SECURITY DEFINER)

-- 5) Função para emitir certificado (idempotente)
CREATE OR REPLACE FUNCTION public.issue_course_certificate(
  p_user_id uuid,
  p_course_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_course RECORD;
  v_completed boolean;
  v_existing RECORD;
  v_duration_minutes integer;
  v_code text;
  v_cert_id uuid;
  v_company_id uuid;
BEGIN
  -- Buscar curso e validar habilitação de certificado
  SELECT 
    c.id, c.company_id, c.title, c.certificate_enabled,
    c.mentor_name, c.mentor_role, c.mentor_signature_url
  INTO v_course
  FROM public.courses c
  WHERE c.id = p_course_id;

  IF v_course.id IS NULL THEN
    RAISE EXCEPTION 'Curso não encontrado';
  END IF;

  IF NOT v_course.certificate_enabled THEN
    RAISE EXCEPTION 'Certificado não habilitado para este curso';
  END IF;

  v_company_id := v_course.company_id;

  -- Validar que a usuária pertence à empresa do curso (perfil ativo)
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = p_user_id
      AND p.company_id = v_company_id
      AND p.is_active = true
  ) THEN
    RAISE EXCEPTION 'Usuária não pertence à empresa deste curso';
  END IF;

  -- Verificar conclusão do curso (função existente)
  SELECT public.check_course_completion(p_user_id, p_course_id)
  INTO v_completed;

  IF NOT v_completed THEN
    RAISE EXCEPTION 'Curso ainda não concluído';
  END IF;

  -- Idempotência: se já existe certificado, retorna o existente
  SELECT *
  INTO v_existing
  FROM public.user_course_certificates ucc
  WHERE ucc.user_id = p_user_id
    AND ucc.course_id = p_course_id
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'id', v_existing.id,
      'certificate_code', v_existing.certificate_code,
      'already_exists', true
    );
  END IF;

  -- Somatória de minutos do curso
  SELECT COALESCE(SUM(cl.duration), 0)
  INTO v_duration_minutes
  FROM public.course_lessons cl
  JOIN public.course_modules cm ON cm.id = cl.module_id
  WHERE cm.course_id = p_course_id;

  -- Código único do certificado
  v_code := 'CERT-' || to_char(now(),'YYYYMMDD') || '-' || substr(encode(gen_random_bytes(8),'hex'),1,8);

  -- Inserir certificado
  INSERT INTO public.user_course_certificates (
    user_id, company_id, course_id, course_title,
    duration_minutes, certificate_code,
    mentor_name, mentor_role, mentor_signature_url,
    issued_by
  ) VALUES (
    p_user_id, v_company_id, p_course_id, v_course.title,
    v_duration_minutes, v_code,
    v_course.mentor_name, v_course.mentor_role, v_course.mentor_signature_url,
    auth.uid()
  )
  RETURNING id INTO v_cert_id;

  RETURN jsonb_build_object(
    'id', v_cert_id,
    'certificate_code', v_code,
    'already_exists', false
  );
END;
$function$;
