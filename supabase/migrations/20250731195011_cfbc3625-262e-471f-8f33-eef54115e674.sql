-- Add spaces_banner_url column to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS spaces_banner_url TEXT;