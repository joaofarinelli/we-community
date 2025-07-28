-- Add feed banner URL field to companies table
ALTER TABLE public.companies 
ADD COLUMN feed_banner_url text;