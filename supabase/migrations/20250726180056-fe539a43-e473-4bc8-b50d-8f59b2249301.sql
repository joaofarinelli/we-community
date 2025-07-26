-- Create trigger to handle lesson completion rewards
CREATE OR REPLACE FUNCTION public.handle_lesson_completion_rewards()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  lesson_company_id uuid;
  lesson_author_id uuid;
  module_completed boolean;
  course_completed boolean;
BEGIN
  -- Get lesson details
  SELECT c.company_id INTO lesson_company_id
  FROM course_lessons cl
  JOIN course_modules cm ON cm.id = cl.module_id
  JOIN courses c ON c.id = cm.course_id
  WHERE cl.id = NEW.lesson_id;
  
  -- Award coins for lesson completion
  PERFORM public.add_user_coins(
    NEW.user_id, 
    lesson_company_id, 
    'lesson_complete', 
    NEW.lesson_id
  );
  
  -- Check if module is now completed
  module_completed := public.check_module_completion(NEW.user_id, NEW.module_id);
  
  IF module_completed THEN
    -- Award coins for module completion
    PERFORM public.add_user_coins(
      NEW.user_id, 
      lesson_company_id, 
      'module_complete', 
      NEW.module_id
    );
    
    -- Check if course is now completed
    course_completed := public.check_course_completion(NEW.user_id, NEW.course_id);
    
    IF course_completed THEN
      -- Award coins for course completion
      PERFORM public.add_user_coins(
        NEW.user_id, 
        lesson_company_id, 
        'course_complete', 
        NEW.course_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for lesson completion
CREATE OR REPLACE TRIGGER handle_lesson_completion_rewards_trigger
  AFTER INSERT ON user_course_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_lesson_completion_rewards();

-- Create trigger to handle lesson likes rewards
CREATE OR REPLACE FUNCTION public.handle_lesson_like_rewards()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  lesson_company_id uuid;
BEGIN
  -- Get lesson company
  SELECT c.company_id INTO lesson_company_id
  FROM course_lessons cl
  JOIN course_modules cm ON cm.id = cl.module_id
  JOIN courses c ON c.id = cm.course_id
  WHERE cl.id = NEW.lesson_id;
  
  -- Award coins for liking a lesson
  PERFORM public.add_user_coins(
    NEW.user_id, 
    lesson_company_id, 
    'lesson_like', 
    NEW.lesson_id
  );
  
  RETURN NEW;
END;
$function$;

-- Create trigger for lesson likes
CREATE OR REPLACE TRIGGER handle_lesson_like_rewards_trigger
  AFTER INSERT ON lesson_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_lesson_like_rewards();