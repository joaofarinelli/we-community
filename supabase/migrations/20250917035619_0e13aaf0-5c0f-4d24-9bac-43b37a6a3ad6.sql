-- Enable real-time for space_categories table
ALTER TABLE public.space_categories REPLICA IDENTITY FULL;

-- Enable real-time for spaces table  
ALTER TABLE public.spaces REPLICA IDENTITY FULL;

-- Enable real-time for posts table
ALTER TABLE public.posts REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.space_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.spaces;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;