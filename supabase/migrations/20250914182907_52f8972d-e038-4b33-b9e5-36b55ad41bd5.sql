-- Align trigger helper functions with new 5-arg signature of update_challenge_progress

-- Posts -> challenge progress
CREATE OR REPLACE FUNCTION public.handle_post_challenge_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $function$
BEGIN
  PERFORM public.update_challenge_progress(
    NEW.author_id,
    NEW.company_id,
    'post_creation'::challenge_type,
    1,
    NEW.id
  );
  RETURN NEW;
END;
$function$;

-- Course progress -> challenge progress (on lesson progress events)
CREATE OR REPLACE FUNCTION public.handle_course_challenge_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $function$
DECLARE
  v_company_id uuid;
BEGIN
  -- Determine company from lesson -> module -> course
  SELECT c.company_id
    INTO v_company_id
  FROM public.courses c
  JOIN public.course_modules cm ON cm.course_id = c.id
  JOIN public.course_lessons cl ON cl.module_id = cm.id
  WHERE cl.id = NEW.lesson_id;

  PERFORM public.update_challenge_progress(
    NEW.user_id,
    v_company_id,
    'course_completion'::challenge_type,
    1,
    NEW.lesson_id
  );
  RETURN NEW;
END;
$function$;

-- Marketplace purchases -> challenge progress
CREATE OR REPLACE FUNCTION public.handle_purchase_challenge_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $function$
BEGIN
  PERFORM public.update_challenge_progress(
    NEW.user_id,
    NEW.company_id,
    'marketplace_purchase'::challenge_type,
    1,
    NULL::uuid
  );
  RETURN NEW;
END;
$function$;