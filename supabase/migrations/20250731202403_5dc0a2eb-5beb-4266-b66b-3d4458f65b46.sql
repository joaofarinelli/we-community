-- Create a more robust trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_post_deletion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  coins_to_remove integer;
BEGIN
  -- Log the values we're working with
  RAISE NOTICE 'Post deletion trigger: post_id=%, author_id=%, company_id=%', 
    COALESCE(OLD.id::text, 'NULL'), 
    COALESCE(OLD.author_id::text, 'NULL'), 
    COALESCE(OLD.company_id::text, 'NULL');
  
  -- Only proceed if we have valid data
  IF OLD.author_id IS NOT NULL AND OLD.company_id IS NOT NULL THEN
    -- Get coins for create_post action
    coins_to_remove := public.calculate_coins_for_action('create_post');
    
    -- Only proceed if there are coins to remove
    IF coins_to_remove > 0 THEN
      -- Directly insert the transaction without calling the function
      INSERT INTO public.point_transactions (user_id, company_id, action_type, points, coins, reference_id)
      VALUES (OLD.author_id, OLD.company_id, 'undo_create_post', -coins_to_remove, -coins_to_remove, OLD.id);
      
      -- Update user's total coins
      UPDATE public.user_points 
      SET 
        total_coins = GREATEST(0, total_coins - coins_to_remove),
        updated_at = now()
      WHERE user_id = OLD.author_id AND company_id = OLD.company_id;
      
      RAISE NOTICE 'Successfully removed % coins for post deletion', coins_to_remove;
    END IF;
  ELSE
    RAISE NOTICE 'Skipping coin removal: invalid author_id or company_id';
  END IF;
  
  RETURN OLD;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in post deletion trigger: %', SQLERRM;
    RETURN OLD; -- Continue with deletion even if coin removal fails
END;
$function$