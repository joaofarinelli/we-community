-- Add login banner URL field to companies table
ALTER TABLE public.companies 
ADD COLUMN login_banner_url text;