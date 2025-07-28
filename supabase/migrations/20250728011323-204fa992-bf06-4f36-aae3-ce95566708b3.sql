-- Set replica identity for tables that might not have it
ALTER TABLE public.companies REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.spaces REPLICA IDENTITY FULL;

-- Try to add tables to publication (ignore if already exists)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore if already exists
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore if already exists
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.spaces;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore if already exists
  END;
END $$;