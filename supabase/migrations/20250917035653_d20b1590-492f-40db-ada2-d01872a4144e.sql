-- Enable full replica identity for better real-time support
ALTER TABLE public.spaces REPLICA IDENTITY FULL;
ALTER TABLE public.posts REPLICA IDENTITY FULL;