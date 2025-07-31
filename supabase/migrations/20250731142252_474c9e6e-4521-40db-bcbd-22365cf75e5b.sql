-- Enable realtime for notifications table only
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Try to add notifications to realtime publication (ignore if already exists)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION
    WHEN duplicate_object THEN
      -- Table already in publication, ignore error
      NULL;
  END;
END $$;