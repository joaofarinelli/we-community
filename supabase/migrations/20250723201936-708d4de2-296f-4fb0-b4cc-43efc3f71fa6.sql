-- Create user_points table to track total points for each user
CREATE TABLE public.user_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Create point_transactions table to track all point-earning actions
CREATE TABLE public.point_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('create_post', 'like_post', 'comment_post', 'receive_like', 'receive_comment')),
  points INTEGER NOT NULL,
  reference_id UUID, -- post or comment ID
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_points
CREATE POLICY "Users can view points in their company" 
ON public.user_points 
FOR SELECT 
USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert their own points" 
ON public.user_points 
FOR INSERT 
WITH CHECK (user_id = auth.uid() AND company_id = get_user_company_id());

CREATE POLICY "System can update user points" 
ON public.user_points 
FOR UPDATE 
USING (company_id = get_user_company_id());

-- RLS policies for point_transactions
CREATE POLICY "Users can view transactions in their company" 
ON public.point_transactions 
FOR SELECT 
USING (company_id = get_user_company_id());

CREATE POLICY "System can insert point transactions" 
ON public.point_transactions 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id());

-- Function to calculate points for different actions
CREATE OR REPLACE FUNCTION public.calculate_points_for_action(action_type text)
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

-- Function to add points to a user
CREATE OR REPLACE FUNCTION public.add_user_points(
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
  points_to_add integer;
BEGIN
  -- Get points for this action
  points_to_add := public.calculate_points_for_action(p_action_type);
  
  -- Insert transaction record
  INSERT INTO public.point_transactions (user_id, company_id, action_type, points, reference_id)
  VALUES (p_user_id, p_company_id, p_action_type, points_to_add, p_reference_id);
  
  -- Update user's total points (upsert)
  INSERT INTO public.user_points (user_id, company_id, total_points)
  VALUES (p_user_id, p_company_id, points_to_add)
  ON CONFLICT (user_id, company_id)
  DO UPDATE SET 
    total_points = user_points.total_points + points_to_add,
    updated_at = now();
END;
$$;

-- Trigger function for post creation
CREATE OR REPLACE FUNCTION public.handle_post_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Add points for creating a post
  PERFORM public.add_user_points(NEW.author_id, NEW.company_id, 'create_post', NEW.id);
  RETURN NEW;
END;
$$;

-- Trigger function for post interactions
CREATE OR REPLACE FUNCTION public.handle_interaction_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Create triggers
CREATE TRIGGER add_post_points
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_post_points();

CREATE TRIGGER add_interaction_points
  AFTER INSERT ON public.post_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_interaction_points();

-- Add trigger for updating updated_at on user_points
CREATE TRIGGER update_user_points_updated_at
  BEFORE UPDATE ON public.user_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();