-- Add banner_url column to course_lessons table
ALTER TABLE public.course_lessons 
ADD COLUMN banner_url TEXT;

-- Add banner_link_url column to course_lessons table  
ALTER TABLE public.course_lessons 
ADD COLUMN banner_link_url TEXT;

-- Add banner_open_new_tab column to course_lessons table
ALTER TABLE public.course_lessons 
ADD COLUMN banner_open_new_tab BOOLEAN DEFAULT true;