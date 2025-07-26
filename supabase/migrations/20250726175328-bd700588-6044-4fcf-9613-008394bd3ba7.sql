-- Extend the coins calculation function to include course-related actions
CREATE OR REPLACE FUNCTION public.calculate_coins_for_action(action_type text)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
BEGIN
  CASE action_type
    WHEN 'create_post' THEN RETURN 10;
    WHEN 'like_post' THEN RETURN 2;
    WHEN 'comment_post' THEN RETURN 5;
    WHEN 'receive_like' THEN RETURN 3;
    WHEN 'receive_comment' THEN RETURN 3;
    WHEN 'lesson_complete' THEN RETURN 15;
    WHEN 'lesson_like' THEN RETURN 3;
    WHEN 'module_complete' THEN RETURN 50;
    WHEN 'course_complete' THEN RETURN 200;
    WHEN 'purchase_item' THEN RETURN 0;
    WHEN 'refund_item' THEN RETURN 0;
    ELSE RETURN 0;
  END CASE;
END;
$function$

-- Function to check if a module is completed by a user
CREATE OR REPLACE FUNCTION public.check_module_completion(p_user_id uuid, p_module_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_lessons integer;
  completed_lessons integer;
BEGIN
  -- Count total lessons in the module
  SELECT COUNT(*) INTO total_lessons
  FROM course_lessons
  WHERE module_id = p_module_id;
  
  -- Count completed lessons by user
  SELECT COUNT(DISTINCT lesson_id) INTO completed_lessons
  FROM user_course_progress
  WHERE user_id = p_user_id
    AND module_id = p_module_id;
  
  -- Return true if all lessons are completed
  RETURN total_lessons > 0 AND completed_lessons = total_lessons;
END;
$function$

-- Function to check if a course is completed by a user
CREATE OR REPLACE FUNCTION public.check_course_completion(p_user_id uuid, p_course_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_modules integer;
  completed_modules integer;
BEGIN
  -- Count total modules in the course
  SELECT COUNT(*) INTO total_modules
  FROM course_modules
  WHERE course_id = p_course_id;
  
  -- Count completed modules by user
  SELECT COUNT(*) INTO completed_modules
  FROM course_modules cm
  WHERE cm.course_id = p_course_id
    AND public.check_module_completion(p_user_id, cm.id);
  
  -- Return true if all modules are completed
  RETURN total_modules > 0 AND completed_modules = total_modules;
END;
$function$

-- Function to handle lesson completion rewards
CREATE OR REPLACE FUNCTION public.handle_lesson_completion_rewards()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  company_id_val uuid;
  module_completed boolean;
  course_completed boolean;
BEGIN
  -- Get company_id from the course
  SELECT c.company_id INTO company_id_val
  FROM courses c
  JOIN course_modules cm ON cm.course_id = c.id
  JOIN course_lessons cl ON cl.module_id = cm.id
  WHERE cl.id = NEW.lesson_id;
  
  -- Give coins for lesson completion
  PERFORM public.add_user_coins(NEW.user_id, company_id_val, 'lesson_complete', NEW.lesson_id);
  
  -- Check if module is now completed
  SELECT public.check_module_completion(NEW.user_id, NEW.module_id) INTO module_completed;
  
  IF module_completed THEN
    -- Check if this is the first time this module is completed by this user
    IF NOT EXISTS (
      SELECT 1 FROM point_transactions 
      WHERE user_id = NEW.user_id 
        AND company_id = company_id_val 
        AND action_type = 'module_complete' 
        AND reference_id = NEW.module_id
    ) THEN
      -- Give coins for module completion
      PERFORM public.add_user_coins(NEW.user_id, company_id_val, 'module_complete', NEW.module_id);
      
      -- Create notification for module completion
      INSERT INTO public.notifications (user_id, company_id, type, title, content, reference_id)
      VALUES (
        NEW.user_id,
        company_id_val,
        'module_completed',
        'Módulo Concluído!',
        'Parabéns! Você concluiu um módulo e ganhou 50 moedas.',
        NEW.module_id
      );
    END IF;
  END IF;
  
  -- Check if course is now completed
  SELECT public.check_course_completion(NEW.user_id, NEW.course_id) INTO course_completed;
  
  IF course_completed THEN
    -- Check if this is the first time this course is completed by this user
    IF NOT EXISTS (
      SELECT 1 FROM point_transactions 
      WHERE user_id = NEW.user_id 
        AND company_id = company_id_val 
        AND action_type = 'course_complete' 
        AND reference_id = NEW.course_id
    ) THEN
      -- Give coins for course completion
      PERFORM public.add_user_coins(NEW.user_id, company_id_val, 'course_complete', NEW.course_id);
      
      -- Create notification for course completion
      INSERT INTO public.notifications (user_id, company_id, type, title, content, reference_id)
      VALUES (
        NEW.user_id,
        company_id_val,
        'course_completed',
        'Curso Concluído!',
        'Parabéns! Você concluiu um curso completo e ganhou 200 moedas.',
        NEW.course_id
      );
    END IF;
  END IF;
  
  -- Create notification for lesson completion
  INSERT INTO public.notifications (user_id, company_id, type, title, content, reference_id)
  VALUES (
    NEW.user_id,
    company_id_val,
    'lesson_completed',
    'Aula Concluída!',
    'Você concluiu uma aula e ganhou 15 moedas.',
    NEW.lesson_id
  );
  
  RETURN NEW;
END;
$function$

-- Function to handle lesson like rewards
CREATE OR REPLACE FUNCTION public.handle_lesson_like_rewards()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  company_id_val uuid;
BEGIN
  -- Get company_id from the course
  SELECT c.company_id INTO company_id_val
  FROM courses c
  JOIN course_modules cm ON cm.course_id = c.id
  JOIN course_lessons cl ON cl.module_id = cm.id
  WHERE cl.id = NEW.lesson_id;
  
  -- Give coins for lesson like
  PERFORM public.add_user_coins(NEW.user_id, company_id_val, 'lesson_like', NEW.lesson_id);
  
  RETURN NEW;
END;
$function$

-- Create triggers
CREATE TRIGGER trigger_lesson_completion_rewards
  AFTER INSERT ON user_course_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_lesson_completion_rewards();

CREATE TRIGGER trigger_lesson_like_rewards
  AFTER INSERT ON lesson_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_lesson_like_rewards();