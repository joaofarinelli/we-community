-- Function to remove coins from user when actions are undone
CREATE OR REPLACE FUNCTION public.remove_user_coins(p_user_id uuid, p_company_id uuid, p_action_type text, p_reference_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  coins_to_remove integer;
  user_total_coins integer;
  new_level_id uuid;
BEGIN
  -- Get coins for this action
  coins_to_remove := public.calculate_coins_for_action(p_action_type);
  
  -- Insert transaction record (negative coins for reversal)
  INSERT INTO public.point_transactions (user_id, company_id, action_type, points, coins, reference_id)
  VALUES (p_user_id, p_company_id, 'undo_' || p_action_type, -coins_to_remove, -coins_to_remove, p_reference_id);
  
  -- Update user's total coins (ensure it doesn't go below 0)
  UPDATE public.user_points 
  SET 
    total_coins = GREATEST(0, total_coins - coins_to_remove),
    updated_at = now()
  WHERE user_id = p_user_id AND company_id = p_company_id
  RETURNING total_coins INTO user_total_coins;
  
  -- If no user points record exists, create one with 0 coins
  IF user_total_coins IS NULL THEN
    INSERT INTO public.user_points (user_id, company_id, total_coins)
    VALUES (p_user_id, p_company_id, 0);
    user_total_coins := 0;
  END IF;
  
  -- Calculate new level
  new_level_id := public.calculate_user_level(p_user_id, p_company_id, user_total_coins);
  
  -- Update user's current level
  INSERT INTO public.user_current_level (user_id, company_id, current_level_id, current_coins)
  VALUES (p_user_id, p_company_id, new_level_id, user_total_coins)
  ON CONFLICT (user_id, company_id)
  DO UPDATE SET 
    current_level_id = new_level_id,
    current_coins = user_total_coins,
    updated_at = now();
END;
$function$

---

-- Function to handle post deletion with coin reversal
CREATE OR REPLACE FUNCTION public.handle_post_deletion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Remove coins for the deleted post
  PERFORM public.remove_user_coins(OLD.author_id, OLD.company_id, 'create_post', OLD.id);
  RETURN OLD;
END;
$function$

---

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

---

-- Create triggers for post and interaction deletion
CREATE TRIGGER handle_post_deletion_trigger
  BEFORE DELETE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_post_deletion();

CREATE TRIGGER handle_interaction_deletion_trigger
  BEFORE DELETE ON public.post_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_interaction_deletion();