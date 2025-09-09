-- Replace RPC to avoid relying on session GUC and fix UUID cast from empty string
DROP FUNCTION IF EXISTS public.issue_course_certificate(uuid, uuid);

CREATE OR REPLACE FUNCTION public.issue_course_certificate(
  p_user_id uuid,
  p_course_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_course RECORD;
  v_company_id uuid;
  v_completed boolean;
  v_existing RECORD;
  v_duration_minutes integer;
  v_code text;
  v_cert_id uuid;
BEGIN
  -- Get course and basic validations
  SELECT id, company_id, title, certificate_enabled, mentor_name, mentor_role, mentor_signature_url
  INTO v_course
  FROM public.courses
  WHERE id = p_course_id;

  IF v_course.id IS NULL THEN
    RAISE EXCEPTION 'Course not found';
  END IF;
  IF NOT v_course.certificate_enabled THEN
    RAISE EXCEPTION 'Certificate not enabled for this course';
  END IF;

  v_company_id := v_course.company_id;

  -- Ensure user belongs to the course company
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = p_user_id
      AND p.company_id = v_company_id
      AND p.is_active = true
  ) THEN
    RAISE EXCEPTION 'User does not belong to the course company';
  END IF;

  -- Check completion
  SELECT public.check_course_completion(p_user_id, p_course_id) INTO v_completed;
  IF NOT v_completed THEN
    RAISE EXCEPTION 'Course not completed';
  END IF;

  -- Check existing certificate
  SELECT * INTO v_existing
  FROM public.user_course_certificates
  WHERE user_id = p_user_id
    AND course_id = p_course_id
    AND company_id = v_company_id;

  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'id', v_existing.id,
      'certificate_code', v_existing.certificate_code,
      'already_exists', true
    );
  END IF;

  -- Sum duration from lessons (minutes)
  SELECT COALESCE(SUM(cl.duration), 0) INTO v_duration_minutes
  FROM public.course_lessons cl
  JOIN public.course_modules cm ON cm.id = cl.module_id
  WHERE cm.course_id = p_course_id;

  -- Generate code
  v_code := UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8));

  -- Insert certificate
  INSERT INTO public.user_course_certificates (
    user_id, company_id, course_id, course_title, certificate_code,
    duration_minutes, issued_at, issued_by,
    mentor_name, mentor_role, mentor_signature_url
  ) VALUES (
    p_user_id, v_company_id, p_course_id, v_course.title, v_code,
    v_duration_minutes, now(), 'system',
    v_course.mentor_name, v_course.mentor_role, v_course.mentor_signature_url
  ) RETURNING id INTO v_cert_id;

  RETURN jsonb_build_object(
    'id', v_cert_id,
    'certificate_code', v_code,
    'already_exists', false
  );
END;
$$;