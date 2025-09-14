-- Enable realtime for course_lessons table only (spaces already configured)
ALTER TABLE public.course_lessons REPLICA IDENTITY FULL;

-- Add course_lessons to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.course_lessons;