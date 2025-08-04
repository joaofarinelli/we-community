-- Enable realtime for posts table
ALTER TABLE public.posts REPLICA IDENTITY FULL;

-- Add the posts table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;

-- Also enable realtime for post_interactions for live comments and likes
ALTER TABLE public.post_interactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_interactions;