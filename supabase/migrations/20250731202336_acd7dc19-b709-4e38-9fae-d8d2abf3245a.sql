-- Temporarily disable the trigger to allow post deletion
DROP TRIGGER IF EXISTS handle_post_deletion_trigger ON public.posts;