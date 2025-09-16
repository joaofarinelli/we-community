-- Enable realtime for event_materials table
ALTER TABLE public.event_materials REPLICA IDENTITY FULL;

-- Add event_materials to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_materials;