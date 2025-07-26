-- Add thumbnail_url column to course_modules table
ALTER TABLE public.course_modules 
ADD COLUMN thumbnail_url text;