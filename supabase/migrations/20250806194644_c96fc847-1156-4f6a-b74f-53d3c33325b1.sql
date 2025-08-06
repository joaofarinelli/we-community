-- Create function to hide a post
CREATE OR REPLACE FUNCTION public.hide_post(
  post_id uuid,
  hidden_by_user uuid,
  hide_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  post_author_id uuid;
  post_company_id uuid;
  user_company_id uuid;
  is_company_owner boolean;
BEGIN
  -- Get post details
  SELECT author_id, company_id INTO post_author_id, post_company_id
  FROM public.posts WHERE id = post_id;
  
  IF post_author_id IS NULL THEN
    RAISE EXCEPTION 'Post not found';
  END IF;
  
  -- Get user's company from profiles
  SELECT company_id INTO user_company_id
  FROM public.profiles 
  WHERE user_id = hidden_by_user;
  
  -- Check if user is company owner/admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = hidden_by_user 
    AND company_id = post_company_id 
    AND role IN ('owner', 'admin')
  ) INTO is_company_owner;
  
  -- Only allow post author or company owner/admin to hide the post
  IF hidden_by_user != post_author_id AND NOT is_company_owner THEN
    RAISE EXCEPTION 'Permission denied: Only post author or admin can hide posts';
  END IF;
  
  -- Hide the post
  UPDATE public.posts 
  SET 
    is_hidden = true,
    hidden_at = now(),
    hidden_by = hidden_by_user,
    hide_reason = hide_post.hide_reason,
    updated_at = now()
  WHERE id = post_id;
END;
$$;

-- Create function to unhide a post
CREATE OR REPLACE FUNCTION public.unhide_post(
  post_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  post_author_id uuid;
  post_company_id uuid;
  user_id uuid;
  is_company_owner boolean;
BEGIN
  user_id := auth.uid();
  
  -- Get post details
  SELECT author_id, company_id INTO post_author_id, post_company_id
  FROM public.posts WHERE id = post_id;
  
  IF post_author_id IS NULL THEN
    RAISE EXCEPTION 'Post not found';
  END IF;
  
  -- Check if user is company owner/admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = unhide_post.user_id 
    AND company_id = post_company_id 
    AND role IN ('owner', 'admin')
  ) INTO is_company_owner;
  
  -- Only allow post author or company owner/admin to unhide the post
  IF user_id != post_author_id AND NOT is_company_owner THEN
    RAISE EXCEPTION 'Permission denied: Only post author or admin can unhide posts';
  END IF;
  
  -- Unhide the post
  UPDATE public.posts 
  SET 
    is_hidden = false,
    hidden_at = NULL,
    hidden_by = NULL,
    hide_reason = NULL,
    updated_at = now()
  WHERE id = post_id;
END;
$$;