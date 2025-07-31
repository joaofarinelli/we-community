-- Simplify the handle_post_deletion function with better error handling
CREATE OR REPLACE FUNCTION public.handle_post_deletion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Add debugging info
  RAISE NOTICE 'Deleting post: id=%, author_id=%, company_id=%', OLD.id, OLD.author_id, OLD.company_id;
  
  -- Remove coins for the deleted post
  IF OLD.author_id IS NOT NULL AND OLD.company_id IS NOT NULL THEN
    PERFORM public.remove_user_coins(OLD.author_id, OLD.company_id, 'create_post', OLD.id);
  ELSE
    RAISE NOTICE 'Skipping coin removal: author_id=%, company_id=%', OLD.author_id, OLD.company_id;
  END IF;
  
  RETURN OLD;
END;
$function$