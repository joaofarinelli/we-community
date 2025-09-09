-- Add thumbnail_url column to course_lessons table
ALTER TABLE public.course_lessons 
ADD COLUMN thumbnail_url text;

-- Create storage bucket for lesson thumbnails
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lesson-thumbnails', 'lesson-thumbnails', true);

-- Create RLS policies for lesson thumbnails bucket
CREATE POLICY "Anyone can view lesson thumbnails" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'lesson-thumbnails');

CREATE POLICY "Authenticated users can upload lesson thumbnails" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'lesson-thumbnails' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own lesson thumbnails" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'lesson-thumbnails' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own lesson thumbnails" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'lesson-thumbnails' AND auth.role() = 'authenticated');