-- Add columns to posts table for hiding functionality
ALTER TABLE public.posts 
ADD COLUMN is_hidden boolean NOT NULL DEFAULT false,
ADD COLUMN hidden_by uuid REFERENCES auth.users(id),
ADD COLUMN hidden_at timestamp with time zone,
ADD COLUMN hidden_reason text;

-- Create index for better performance on hidden posts queries
CREATE INDEX idx_posts_is_hidden ON public.posts(is_hidden, company_id);

-- Update existing RLS policies to exclude hidden posts for regular users
DROP POLICY IF EXISTS "Users can view posts in accessible spaces" ON public.posts;

-- Create new policy that excludes hidden posts for regular users
CREATE POLICY "Users can view non-hidden posts in accessible spaces" 
ON public.posts 
FOR SELECT 
USING (
  company_id = get_user_company_id() 
  AND can_user_see_space(space_id, auth.uid()) 
  AND (
    is_hidden = false 
    OR is_company_owner() 
    OR auth.uid() = author_id
  )
);

-- Allow company owners and admins to hide/unhide posts
CREATE POLICY "Company owners can update post visibility" 
ON public.posts 
FOR UPDATE 
USING (
  company_id = get_user_company_id() 
  AND is_company_owner()
)
WITH CHECK (
  company_id = get_user_company_id() 
  AND is_company_owner()
);