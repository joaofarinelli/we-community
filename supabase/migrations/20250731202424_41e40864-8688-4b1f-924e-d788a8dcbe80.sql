-- Recreate the trigger with the improved function
CREATE TRIGGER handle_post_deletion_trigger
  BEFORE DELETE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_post_deletion();