-- Function to handle interaction deletion with coin reversal
CREATE OR REPLACE FUNCTION public.handle_interaction_deletion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  post_author_id uuid;
  post_company_id uuid;
BEGIN
  -- Get post author and company
  SELECT author_id, company_id INTO post_author_id, post_company_id
  FROM public.posts WHERE id = OLD.post_id;
  
  IF OLD.type = 'like' THEN
    -- Remove coins from the user who liked
    PERFORM public.remove_user_coins(OLD.user_id, post_company_id, 'like_post', OLD.post_id);
    -- Remove coins from the post author for losing a like
    PERFORM public.remove_user_coins(post_author_id, post_company_id, 'receive_like', OLD.post_id);
  ELSIF OLD.type = 'comment' THEN
    -- Remove coins from the user who commented
    PERFORM public.remove_user_coins(OLD.user_id, post_company_id, 'comment_post', OLD.post_id);
    -- Remove coins from the post author for losing a comment
    PERFORM public.remove_user_coins(post_author_id, post_company_id, 'receive_comment', OLD.post_id);
  END IF;
  
  RETURN OLD;
END;
$function$