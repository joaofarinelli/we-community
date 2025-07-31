-- Enable realtime for required tables
ALTER TABLE public.trail_stage_responses REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.trail_stage_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;