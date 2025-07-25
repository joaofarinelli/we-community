-- Add search_path security to all database functions to prevent schema poisoning attacks

-- Function: update_conversation_last_message
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  UPDATE public.conversations
  SET 
    last_message_at = NEW.created_at,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$function$;

-- Function: find_or_create_direct_conversation
CREATE OR REPLACE FUNCTION public.find_or_create_direct_conversation(p_user1_id uuid, p_user2_id uuid, p_company_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  conversation_id UUID;
BEGIN
  -- Try to find existing direct conversation between the two users
  SELECT c.id INTO conversation_id
  FROM public.conversations c
  WHERE c.company_id = p_company_id
    AND c.type = 'direct'
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp1
      WHERE cp1.conversation_id = c.id AND cp1.user_id = p_user1_id
    )
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp2
      WHERE cp2.conversation_id = c.id AND cp2.user_id = p_user2_id
    )
    AND (
      SELECT COUNT(*) FROM public.conversation_participants cp
      WHERE cp.conversation_id = c.id
    ) = 2;

  -- If conversation doesn't exist, create it
  IF conversation_id IS NULL THEN
    INSERT INTO public.conversations (company_id, type)
    VALUES (p_company_id, 'direct')
    RETURNING id INTO conversation_id;

    -- Add both users as participants
    INSERT INTO public.conversation_participants (conversation_id, user_id, company_id)
    VALUES 
      (conversation_id, p_user1_id, p_company_id),
      (conversation_id, p_user2_id, p_company_id);
  END IF;

  RETURN conversation_id;
END;
$function$;

-- Function: calculate_points_for_action
CREATE OR REPLACE FUNCTION public.calculate_points_for_action(action_type text)
 RETURNS integer
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path = public
AS $function$
BEGIN
  CASE action_type
    WHEN 'create_post' THEN RETURN 10;
    WHEN 'like_post' THEN RETURN 2;
    WHEN 'comment_post' THEN RETURN 5;
    WHEN 'receive_like' THEN RETURN 3;
    WHEN 'receive_comment' THEN RETURN 3;
    ELSE RETURN 0;
  END CASE;
END;
$function$;

-- Function: handle_post_points
CREATE OR REPLACE FUNCTION public.handle_post_points()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Add points for creating a post
  PERFORM public.add_user_points(NEW.author_id, NEW.company_id, 'create_post', NEW.id);
  RETURN NEW;
END;
$function$;

-- Function: handle_interaction_points
CREATE OR REPLACE FUNCTION public.handle_interaction_points()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  post_author_id uuid;
  post_company_id uuid;
BEGIN
  -- Get post author and company for giving them points
  SELECT author_id, company_id INTO post_author_id, post_company_id
  FROM public.posts WHERE id = NEW.post_id;
  
  IF NEW.type = 'like' THEN
    -- Add points to the user who liked
    PERFORM public.add_user_points(NEW.user_id, post_company_id, 'like_post', NEW.post_id);
    -- Add points to the post author for receiving a like
    PERFORM public.add_user_points(post_author_id, post_company_id, 'receive_like', NEW.post_id);
  ELSIF NEW.type = 'comment' THEN
    -- Add points to the user who commented
    PERFORM public.add_user_points(NEW.user_id, post_company_id, 'comment_post', NEW.post_id);
    -- Add points to the post author for receiving a comment
    PERFORM public.add_user_points(post_author_id, post_company_id, 'receive_comment', NEW.post_id);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Function: add_user_points
CREATE OR REPLACE FUNCTION public.add_user_points(p_user_id uuid, p_company_id uuid, p_action_type text, p_reference_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Redirect to add_user_coins function for consistency
  PERFORM public.add_user_coins(p_user_id, p_company_id, p_action_type, p_reference_id);
END;
$function$;

-- Function: add_space_creator_as_member
CREATE OR REPLACE FUNCTION public.add_space_creator_as_member()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.space_members (space_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$function$;

-- Function: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Function: get_user_company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid();
$function$;

-- Function: is_company_owner
CREATE OR REPLACE FUNCTION public.is_company_owner()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'owner'
  );
$function$;

-- Function: create_default_space_category
CREATE OR REPLACE FUNCTION public.create_default_space_category()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.space_categories (company_id, name, order_index, created_by)
  VALUES (NEW.id, 'Espaços', 0, 
    (SELECT user_id FROM public.profiles WHERE company_id = NEW.id AND role = 'owner' LIMIT 1)
  );
  RETURN NEW;
END;
$function$;

-- Function: is_space_member
CREATE OR REPLACE FUNCTION public.is_space_member(space_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.space_members 
    WHERE space_members.space_id = is_space_member.space_id 
    AND space_members.user_id = is_space_member.user_id
  );
END;
$function$;

-- Function: can_user_see_space
CREATE OR REPLACE FUNCTION public.can_user_see_space(space_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  space_visibility text;
  user_company_id uuid;
  space_company_id uuid;
  is_company_owner boolean;
BEGIN
  -- Get space visibility and company
  SELECT visibility, company_id INTO space_visibility, space_company_id
  FROM public.spaces WHERE id = space_id;
  
  -- Get user company
  SELECT company_id INTO user_company_id
  FROM public.profiles WHERE profiles.user_id = can_user_see_space.user_id;
  
  -- Check if user is company owner
  SELECT public.is_company_owner() INTO is_company_owner;
  
  -- Different companies cannot see each other's spaces
  IF space_company_id != user_company_id THEN
    RETURN false;
  END IF;
  
  -- Company owners can see all spaces
  IF is_company_owner THEN
    RETURN true;
  END IF;
  
  -- Public spaces are visible to everyone in the company
  IF space_visibility = 'public' THEN
    RETURN true;
  END IF;
  
  -- Private and secret spaces require membership
  IF space_visibility IN ('private', 'secret') THEN
    RETURN public.is_space_member(space_id, user_id);
  END IF;
  
  RETURN false;
END;
$function$;

-- Function: calculate_user_level
CREATE OR REPLACE FUNCTION public.calculate_user_level(p_user_id uuid, p_company_id uuid, p_coins integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  level_id uuid;
BEGIN
  -- Find the appropriate level based on coins
  SELECT id INTO level_id
  FROM public.user_levels
  WHERE company_id = p_company_id
    AND min_coins_required <= p_coins
    AND (max_coins_required IS NULL OR p_coins <= max_coins_required)
  ORDER BY level_number DESC
  LIMIT 1;
  
  RETURN level_id;
END;
$function$;

-- Function: handle_post_coins
CREATE OR REPLACE FUNCTION public.handle_post_coins()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Add coins for creating a post
  PERFORM public.add_user_coins(NEW.author_id, NEW.company_id, 'create_post', NEW.id);
  RETURN NEW;
END;
$function$;

-- Function: handle_interaction_coins
CREATE OR REPLACE FUNCTION public.handle_interaction_coins()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  post_author_id uuid;
  post_company_id uuid;
BEGIN
  -- Get post author and company for giving them coins
  SELECT author_id, company_id INTO post_author_id, post_company_id
  FROM public.posts WHERE id = NEW.post_id;
  
  IF NEW.type = 'like' THEN
    -- Add coins to the user who liked
    PERFORM public.add_user_coins(NEW.user_id, post_company_id, 'like_post', NEW.post_id);
    -- Add coins to the post author for receiving a like
    PERFORM public.add_user_coins(post_author_id, post_company_id, 'receive_like', NEW.post_id);
  ELSIF NEW.type = 'comment' THEN
    -- Add coins to the user who commented
    PERFORM public.add_user_coins(NEW.user_id, post_company_id, 'comment_post', NEW.post_id);
    -- Add coins to the post author for receiving a comment
    PERFORM public.add_user_coins(post_author_id, post_company_id, 'receive_comment', NEW.post_id);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Function: create_default_levels
CREATE OR REPLACE FUNCTION public.create_default_levels(p_company_id uuid, p_created_by uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Create default levels
  INSERT INTO public.user_levels (company_id, level_number, level_name, min_coins_required, max_coins_required, level_color, level_icon, created_by)
  VALUES 
    (p_company_id, 1, 'Iniciante', 0, 49, '#8B5CF6', 'Sparkles', p_created_by),
    (p_company_id, 2, 'Bronze', 50, 149, '#CD7F32', 'Award', p_created_by),
    (p_company_id, 3, 'Prata', 150, 349, '#C0C0C0', 'Medal', p_created_by),
    (p_company_id, 4, 'Ouro', 350, 699, '#FFD700', 'Trophy', p_created_by),
    (p_company_id, 5, 'Diamante', 700, NULL, '#B9F2FF', 'Crown', p_created_by);
END;
$function$;

-- Function: create_default_levels_trigger
CREATE OR REPLACE FUNCTION public.create_default_levels_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  owner_user_id uuid;
BEGIN
  -- Get the owner user_id
  SELECT user_id INTO owner_user_id
  FROM public.profiles 
  WHERE company_id = NEW.id AND role = 'owner' 
  LIMIT 1;
  
  IF owner_user_id IS NOT NULL THEN
    PERFORM public.create_default_levels(NEW.id, owner_user_id);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Function: add_user_coins
CREATE OR REPLACE FUNCTION public.add_user_coins(p_user_id uuid, p_company_id uuid, p_action_type text, p_reference_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  coins_to_add integer;
  user_total_coins integer;
  new_level_id uuid;
BEGIN
  -- Get coins for this action
  coins_to_add := public.calculate_coins_for_action(p_action_type);
  
  -- Insert transaction record
  INSERT INTO public.point_transactions (user_id, company_id, action_type, points, coins, reference_id)
  VALUES (p_user_id, p_company_id, p_action_type, coins_to_add, coins_to_add, p_reference_id);
  
  -- Update user's total coins (upsert)
  INSERT INTO public.user_points (user_id, company_id, total_coins)
  VALUES (p_user_id, p_company_id, coins_to_add)
  ON CONFLICT (user_id, company_id)
  DO UPDATE SET 
    total_coins = user_points.total_coins + coins_to_add,
    updated_at = now()
  RETURNING total_coins INTO user_total_coins;
  
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
$function$;

-- Function: calculate_coins_for_action
CREATE OR REPLACE FUNCTION public.calculate_coins_for_action(action_type text)
 RETURNS integer
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path = public
AS $function$
BEGIN
  CASE action_type
    WHEN 'create_post' THEN RETURN 10;
    WHEN 'like_post' THEN RETURN 2;
    WHEN 'comment_post' THEN RETURN 5;
    WHEN 'receive_like' THEN RETURN 3;
    WHEN 'receive_comment' THEN RETURN 3;
    WHEN 'purchase_item' THEN RETURN 0; -- Purchases don't add coins, they deduct
    WHEN 'refund_item' THEN RETURN 0; -- Refunds add coins back
    ELSE RETURN 0;
  END CASE;
END;
$function$;

-- Function: deduct_user_coins
CREATE OR REPLACE FUNCTION public.deduct_user_coins(p_user_id uuid, p_company_id uuid, p_coins integer, p_reference_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  current_coins integer;
  new_level_id uuid;
BEGIN
  -- Check if user has enough coins
  SELECT total_coins INTO current_coins
  FROM public.user_points
  WHERE user_id = p_user_id AND company_id = p_company_id;
  
  IF current_coins IS NULL OR current_coins < p_coins THEN
    RETURN false; -- Not enough coins
  END IF;
  
  -- Insert transaction record (negative coins for purchase)
  INSERT INTO public.point_transactions (user_id, company_id, action_type, points, coins, reference_id)
  VALUES (p_user_id, p_company_id, 'purchase_item', -p_coins, -p_coins, p_reference_id);
  
  -- Update user's total coins
  UPDATE public.user_points 
  SET 
    total_coins = total_coins - p_coins,
    updated_at = now()
  WHERE user_id = p_user_id AND company_id = p_company_id
  RETURNING total_coins INTO current_coins;
  
  -- Calculate new level
  new_level_id := public.calculate_user_level(p_user_id, p_company_id, current_coins);
  
  -- Update user's current level
  UPDATE public.user_current_level 
  SET 
    current_level_id = new_level_id,
    current_coins = current_coins,
    updated_at = now()
  WHERE user_id = p_user_id AND company_id = p_company_id;
  
  RETURN true;
END;
$function$;

-- Function: transfer_user_coins
CREATE OR REPLACE FUNCTION public.transfer_user_coins(p_from_user_id uuid, p_to_user_id uuid, p_company_id uuid, p_coins integer, p_reference_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  from_user_coins integer;
  new_from_level_id uuid;
  new_to_level_id uuid;
  to_user_total_coins integer;
BEGIN
  -- Check if sender has enough coins
  SELECT total_coins INTO from_user_coins
  FROM public.user_points
  WHERE user_id = p_from_user_id AND company_id = p_company_id;
  
  IF from_user_coins IS NULL OR from_user_coins < p_coins THEN
    RETURN false;
  END IF;
  
  -- Deduct coins from sender
  INSERT INTO public.point_transactions (user_id, company_id, action_type, points, coins, reference_id)
  VALUES (p_from_user_id, p_company_id, 'transfer_sent', -p_coins, -p_coins, p_reference_id);
  
  UPDATE public.user_points 
  SET total_coins = total_coins - p_coins, updated_at = now()
  WHERE user_id = p_from_user_id AND company_id = p_company_id;
  
  -- Add coins to receiver
  INSERT INTO public.point_transactions (user_id, company_id, action_type, points, coins, reference_id)
  VALUES (p_to_user_id, p_company_id, 'transfer_received', p_coins, p_coins, p_reference_id);
  
  INSERT INTO public.user_points (user_id, company_id, total_coins)
  VALUES (p_to_user_id, p_company_id, p_coins)
  ON CONFLICT (user_id, company_id)
  DO UPDATE SET 
    total_coins = user_points.total_coins + p_coins,
    updated_at = now()
  RETURNING total_coins INTO to_user_total_coins;
  
  -- Update levels for both users
  new_from_level_id := public.calculate_user_level(p_from_user_id, p_company_id, from_user_coins - p_coins);
  new_to_level_id := public.calculate_user_level(p_to_user_id, p_company_id, to_user_total_coins);
  
  -- Update sender's level
  UPDATE public.user_current_level 
  SET current_level_id = new_from_level_id, current_coins = from_user_coins - p_coins, updated_at = now()
  WHERE user_id = p_from_user_id AND company_id = p_company_id;
  
  -- Update receiver's level
  INSERT INTO public.user_current_level (user_id, company_id, current_level_id, current_coins)
  VALUES (p_to_user_id, p_company_id, new_to_level_id, to_user_total_coins)
  ON CONFLICT (user_id, company_id)
  DO UPDATE SET 
    current_level_id = new_to_level_id,
    current_coins = to_user_total_coins,
    updated_at = now();
  
  RETURN true;
END;
$function$;

-- Function: process_marketplace_purchase
CREATE OR REPLACE FUNCTION public.process_marketplace_purchase(p_user_id uuid, p_company_id uuid, p_item_id uuid, p_quantity integer DEFAULT 1)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  item_record RECORD;
  total_cost integer;
  purchase_id uuid;
  success boolean;
  seller_user_id uuid;
  seller_type_val text;
BEGIN
  -- Get item details and check availability
  SELECT * INTO item_record
  FROM public.marketplace_items
  WHERE id = p_item_id AND company_id = p_company_id AND is_active = true;
  
  IF item_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not found or inactive');
  END IF;
  
  -- Check stock if limited
  IF item_record.stock_quantity IS NOT NULL AND item_record.stock_quantity < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient stock');
  END IF;
  
  -- Calculate total cost
  total_cost := item_record.price_coins * p_quantity;
  seller_user_id := item_record.seller_id;
  seller_type_val := item_record.seller_type;
  
  -- Deduct coins from buyer
  SELECT public.deduct_user_coins(p_user_id, p_company_id, total_cost, p_item_id) INTO success;
  
  IF NOT success THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient coins');
  END IF;
  
  -- If seller is a user, transfer coins to them
  IF seller_type_val = 'user' AND seller_user_id IS NOT NULL THEN
    -- Add coins to seller
    INSERT INTO public.point_transactions (user_id, company_id, action_type, points, coins, reference_id)
    VALUES (seller_user_id, p_company_id, 'item_sold', total_cost, total_cost, p_item_id);
    
    -- Update seller's total coins
    INSERT INTO public.user_points (user_id, company_id, total_coins)
    VALUES (seller_user_id, p_company_id, total_cost)
    ON CONFLICT (user_id, company_id)
    DO UPDATE SET 
      total_coins = user_points.total_coins + total_cost,
      updated_at = now();
    
    -- Update seller's level
    DECLARE
      seller_total_coins integer;
      new_seller_level_id uuid;
    BEGIN
      SELECT total_coins INTO seller_total_coins
      FROM public.user_points
      WHERE user_id = seller_user_id AND company_id = p_company_id;
      
      new_seller_level_id := public.calculate_user_level(seller_user_id, p_company_id, seller_total_coins);
      
      INSERT INTO public.user_current_level (user_id, company_id, current_level_id, current_coins)
      VALUES (seller_user_id, p_company_id, new_seller_level_id, seller_total_coins)
      ON CONFLICT (user_id, company_id)
      DO UPDATE SET 
        current_level_id = new_seller_level_id,
        current_coins = seller_total_coins,
        updated_at = now();
    END;
    
    -- Create notification for seller
    INSERT INTO public.notifications (user_id, company_id, type, title, content, reference_id)
    VALUES (
      seller_user_id,
      p_company_id,
      'item_sold',
      'Item Vendido!',
      'Seu item "' || item_record.name || '" foi vendido por ' || total_cost || ' moedas.',
      purchase_id
    );
  END IF;
  
  -- Create purchase record
  INSERT INTO public.marketplace_purchases (
    company_id, user_id, item_id, item_name, price_coins, quantity
  ) VALUES (
    p_company_id, p_user_id, p_item_id, item_record.name, item_record.price_coins, p_quantity
  ) RETURNING id INTO purchase_id;
  
  -- Update stock if limited
  IF item_record.stock_quantity IS NOT NULL THEN
    UPDATE public.marketplace_items 
    SET stock_quantity = stock_quantity - p_quantity
    WHERE id = p_item_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'purchase_id', purchase_id,
    'total_cost', total_cost
  );
END;
$function$;

-- Function: update_challenge_progress
CREATE OR REPLACE FUNCTION public.update_challenge_progress(p_user_id uuid, p_company_id uuid, p_challenge_type challenge_type, p_increment integer DEFAULT 1, p_reference_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  challenge_record RECORD;
  progress_record RECORD;
  new_progress INTEGER;
BEGIN
  -- Find active challenges of the specified type
  FOR challenge_record IN 
    SELECT * FROM public.challenges 
    WHERE company_id = p_company_id 
    AND challenge_type = p_challenge_type
    AND is_active = true
    AND (start_date <= now())
    AND (end_date IS NULL OR end_date >= now())
  LOOP
    -- Get or create progress record
    INSERT INTO public.challenge_progress (
      challenge_id, user_id, company_id, progress_value, target_value
    ) VALUES (
      challenge_record.id, 
      p_user_id, 
      p_company_id, 
      0,
      COALESCE((challenge_record.requirements->>'target_value')::INTEGER, 1)
    )
    ON CONFLICT (challenge_id, user_id) 
    DO NOTHING;
    
    -- Update progress
    UPDATE public.challenge_progress 
    SET 
      progress_value = progress_value + p_increment,
      updated_at = now()
    WHERE challenge_id = challenge_record.id 
    AND user_id = p_user_id
    RETURNING progress_value, target_value, is_completed INTO progress_record;
    
    -- Check if challenge is completed
    IF progress_record.progress_value >= progress_record.target_value AND NOT progress_record.is_completed THEN
      -- Mark as completed
      UPDATE public.challenge_progress 
      SET 
        is_completed = true,
        completed_at = now(),
        updated_at = now()
      WHERE challenge_id = challenge_record.id AND user_id = p_user_id;
      
      -- Process reward
      PERFORM public.process_challenge_reward(challenge_record.id, p_user_id, p_company_id);
      
      -- Create notification
      INSERT INTO public.notifications (
        user_id, company_id, type, title, content, reference_id
      ) VALUES (
        p_user_id,
        p_company_id,
        'challenge_completed',
        'Desafio Concluído!',
        'Parabéns! Você concluiu o desafio "' || challenge_record.title || '" e recebeu sua recompensa.',
        challenge_record.id
      );
    END IF;
  END LOOP;
END;
$function$;

-- Function: handle_post_challenge_progress
CREATE OR REPLACE FUNCTION public.handle_post_challenge_progress()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  PERFORM public.update_challenge_progress(
    NEW.author_id, 
    NEW.company_id, 
    'post_creation'::challenge_type
  );
  RETURN NEW;
END;
$function$;

-- Function: handle_purchase_challenge_progress
CREATE OR REPLACE FUNCTION public.handle_purchase_challenge_progress()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  PERFORM public.update_challenge_progress(
    NEW.user_id, 
    NEW.company_id, 
    'marketplace_purchase'::challenge_type
  );
  RETURN NEW;
END;
$function$;

-- Function: handle_course_challenge_progress
CREATE OR REPLACE FUNCTION public.handle_course_challenge_progress()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  PERFORM public.update_challenge_progress(
    NEW.user_id, 
    (SELECT c.company_id FROM courses c 
     JOIN course_modules cm ON cm.course_id = c.id 
     JOIN course_lessons cl ON cl.module_id = cm.id 
     WHERE cl.id = NEW.lesson_id), 
    'course_completion'::challenge_type
  );
  RETURN NEW;
END;
$function$;

-- Function: process_challenge_reward
CREATE OR REPLACE FUNCTION public.process_challenge_reward(p_challenge_id uuid, p_user_id uuid, p_company_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  challenge_record RECORD;
  reward_amount INTEGER;
  total_coins INTEGER;
  new_level_id UUID;
BEGIN
  -- Get challenge details
  SELECT * INTO challenge_record 
  FROM public.challenges 
  WHERE id = p_challenge_id;
  
  -- Process reward based on type
  CASE challenge_record.reward_type
    WHEN 'coins' THEN
      reward_amount := (challenge_record.reward_value->>'amount')::INTEGER;
      
      -- Insert coins transaction
      INSERT INTO public.point_transactions (user_id, company_id, action_type, points, coins, reference_id)
      VALUES (p_user_id, p_company_id, 'challenge_reward', reward_amount, reward_amount, p_challenge_id);
      
      -- Update total coins
      INSERT INTO public.user_points (user_id, company_id, total_coins)
      VALUES (p_user_id, p_company_id, reward_amount)
      ON CONFLICT (user_id, company_id)
      DO UPDATE SET 
        total_coins = user_points.total_coins + reward_amount,
        updated_at = now()
      RETURNING total_coins INTO total_coins;
      
      -- Update user level
      new_level_id := public.calculate_user_level(p_user_id, p_company_id, total_coins);
      
      INSERT INTO public.user_current_level (user_id, company_id, current_level_id, current_coins)
      VALUES (p_user_id, p_company_id, new_level_id, total_coins)
      ON CONFLICT (user_id, company_id)
      DO UPDATE SET 
        current_level_id = new_level_id,
        current_coins = total_coins,
        updated_at = now();
    
    WHEN 'course_access' THEN
      -- Course access would be handled by application logic
      NULL;
    
    WHEN 'file_download' THEN
      -- File download access would be handled by application logic
      NULL;
    
    WHEN 'marketplace_item' THEN
      -- Marketplace item access would be handled by application logic
      NULL;
  END CASE;
  
  -- Record the reward
  INSERT INTO public.challenge_rewards (
    challenge_id, user_id, company_id, reward_type, reward_details
  ) VALUES (
    p_challenge_id, p_user_id, p_company_id, 
    challenge_record.reward_type::TEXT, challenge_record.reward_value
  );
END;
$function$;

-- Function: is_user_active
CREATE OR REPLACE FUNCTION public.is_user_active()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT COALESCE(is_active, true) 
  FROM public.profiles 
  WHERE user_id = auth.uid();
$function$;