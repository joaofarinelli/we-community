-- Enable realtime for companies table
ALTER TABLE public.companies REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.companies;

-- Enable realtime for profiles table (affects user counts)
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Enable realtime for posts table (affects activity metrics)
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;

-- Enable realtime for spaces table (affects space counts)
ALTER TABLE public.spaces REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.spaces;