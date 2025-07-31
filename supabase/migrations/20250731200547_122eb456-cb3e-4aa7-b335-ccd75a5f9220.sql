-- Create triggers for post and interaction deletion
CREATE TRIGGER handle_post_deletion_trigger
  BEFORE DELETE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_post_deletion();

CREATE TRIGGER handle_interaction_deletion_trigger
  BEFORE DELETE ON public.post_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_interaction_deletion();