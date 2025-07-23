-- Add parent_comment_id column to support nested replies
ALTER TABLE public.post_interactions 
ADD COLUMN parent_comment_id UUID REFERENCES public.post_interactions(id) ON DELETE CASCADE;

-- Add index for better performance when querying nested comments
CREATE INDEX idx_post_interactions_parent_comment_id ON public.post_interactions(parent_comment_id);