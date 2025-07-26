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
$function$;