-- WomanCoins System with Configurable Levels Migration (Fixed)

-- First, create the user_levels table for configurable levels
CREATE TABLE public.user_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  level_number INTEGER NOT NULL,
  level_name TEXT NOT NULL,
  min_coins_required INTEGER NOT NULL DEFAULT 0,
  max_coins_required INTEGER,
  level_color TEXT NOT NULL DEFAULT '#3B82F6',
  level_icon TEXT NOT NULL DEFAULT 'Trophy',
  created_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, level_number),
  UNIQUE(company_id, level_name)
);

-- Enable RLS on user_levels
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;

-- Create user_current_level table to track each user's current level
CREATE TABLE public.user_current_level (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  current_level_id UUID REFERENCES public.user_levels(id) ON DELETE SET NULL,
  current_coins INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Enable RLS on user_current_level
ALTER TABLE public.user_current_level ENABLE ROW LEVEL SECURITY;

-- Add coins column to existing tables (keeping points for backward compatibility during migration)
ALTER TABLE public.user_points ADD COLUMN total_coins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.point_transactions ADD COLUMN coins INTEGER NOT NULL DEFAULT 0;

-- Update existing data to use coins (1:1 conversion for now)
UPDATE public.user_points SET total_coins = total_points;
UPDATE public.point_transactions SET coins = points;

-- RLS Policies for user_levels
CREATE POLICY "Users can view levels in their company" 
ON public.user_levels 
FOR SELECT 
USING (company_id = get_user_company_id());

CREATE POLICY "Company owners can create levels" 
ON public.user_levels 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id() AND is_company_owner() AND auth.uid() = created_by);

CREATE POLICY "Company owners can update levels" 
ON public.user_levels 
FOR UPDATE 
USING (company_id = get_user_company_id() AND is_company_owner());

CREATE POLICY "Company owners can delete levels" 
ON public.user_levels 
FOR DELETE 
USING (company_id = get_user_company_id() AND is_company_owner());

-- RLS Policies for user_current_level
CREATE POLICY "Users can view current levels in their company" 
ON public.user_current_level 
FOR SELECT 
USING (company_id = get_user_company_id());

CREATE POLICY "System can insert user current level" 
ON public.user_current_level 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "System can update user current level" 
ON public.user_current_level 
FOR UPDATE 
USING (company_id = get_user_company_id());

-- Update calculate_points_for_action to calculate_coins_for_action
CREATE OR REPLACE FUNCTION public.calculate_coins_for_action(action_type text)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
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
$$;

-- Function to calculate user level based on coins
CREATE OR REPLACE FUNCTION public.calculate_user_level(p_user_id uuid, p_company_id uuid, p_coins integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Update add_user_points to add_user_coins with level calculation
CREATE OR REPLACE FUNCTION public.add_user_coins(
  p_user_id uuid,
  p_company_id uuid,
  p_action_type text,
  p_reference_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  coins_to_add integer;
  total_coins integer;
  new_level_id uuid;
BEGIN
  -- Get coins for this action
  coins_to_add := public.calculate_coins_for_action(p_action_type);
  
  -- Insert transaction record
  INSERT INTO public.point_transactions (user_id, company_id, action_type, points, coins, reference_id)
  VALUES (p_user_id, p_company_id, p_action_type, coins_to_add, coins_to_add, p_reference_id);
  
  -- Update user's total points and coins (upsert)
  INSERT INTO public.user_points (user_id, company_id, total_points, total_coins)
  VALUES (p_user_id, p_company_id, coins_to_add, coins_to_add)
  ON CONFLICT (user_id, company_id)
  DO UPDATE SET 
    total_points = user_points.total_points + coins_to_add,
    total_coins = user_points.total_coins + coins_to_add,
    updated_at = now()
  RETURNING total_coins INTO total_coins;
  
  -- Calculate new level
  new_level_id := public.calculate_user_level(p_user_id, p_company_id, total_coins);
  
  -- Update user's current level
  INSERT INTO public.user_current_level (user_id, company_id, current_level_id, current_coins)
  VALUES (p_user_id, p_company_id, new_level_id, total_coins)
  ON CONFLICT (user_id, company_id)
  DO UPDATE SET 
    current_level_id = new_level_id,
    current_coins = total_coins,
    updated_at = now();
END;
$$;

-- Create trigger functions BEFORE creating triggers
CREATE OR REPLACE FUNCTION public.handle_post_coins()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Add coins for creating a post
  PERFORM public.add_user_coins(NEW.author_id, NEW.company_id, 'create_post', NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_interaction_coins()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Now update triggers to use new functions
DROP TRIGGER IF EXISTS add_post_points ON public.posts;
CREATE TRIGGER add_post_coins
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_post_coins();

DROP TRIGGER IF EXISTS add_interaction_points ON public.post_interactions;
CREATE TRIGGER add_interaction_coins
  AFTER INSERT ON public.post_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_interaction_coins();

-- Function to create default levels for a company
CREATE OR REPLACE FUNCTION public.create_default_levels(p_company_id uuid, p_created_by uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Trigger to create default levels when a company is created
CREATE OR REPLACE FUNCTION public.create_default_levels_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

CREATE TRIGGER create_default_levels_on_company_creation
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_levels_trigger();

-- Migrate existing users to have current level
INSERT INTO public.user_current_level (user_id, company_id, current_coins)
SELECT 
  up.user_id,
  up.company_id,
  up.total_coins
FROM public.user_points up
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_current_level ucl 
  WHERE ucl.user_id = up.user_id AND ucl.company_id = up.company_id
);

-- Update current levels for all existing users
UPDATE public.user_current_level
SET current_level_id = public.calculate_user_level(user_id, company_id, current_coins);

-- Add triggers for updating timestamps
CREATE TRIGGER update_user_levels_updated_at
  BEFORE UPDATE ON public.user_levels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_current_level_updated_at
  BEFORE UPDATE ON public.user_current_level
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();