-- Remove unique constraint to allow multiple comments from same user
ALTER TABLE public.post_interactions 
DROP CONSTRAINT IF EXISTS post_interactions_post_id_user_id_type_key;