-- Add course_banner_url column to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS course_banner_url text;