-- Add ON DELETE CASCADE to post_interactions foreign keys to allow post deletion when it has comments

-- First, drop the existing foreign key constraint
ALTER TABLE public.post_interactions 
DROP CONSTRAINT IF EXISTS post_interactions_post_id_fkey;

-- Recreate the foreign key with ON DELETE CASCADE
ALTER TABLE public.post_interactions 
ADD CONSTRAINT post_interactions_post_id_fkey 
FOREIGN KEY (post_id) 
REFERENCES public.posts(id) 
ON DELETE CASCADE;

-- Also handle the parent_comment_id self-reference with CASCADE
ALTER TABLE public.post_interactions 
DROP CONSTRAINT IF EXISTS post_interactions_parent_comment_id_fkey;

ALTER TABLE public.post_interactions 
ADD CONSTRAINT post_interactions_parent_comment_id_fkey 
FOREIGN KEY (parent_comment_id) 
REFERENCES public.post_interactions(id) 
ON DELETE CASCADE;