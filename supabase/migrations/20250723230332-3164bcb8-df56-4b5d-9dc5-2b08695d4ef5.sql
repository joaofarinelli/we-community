-- Add theme configuration columns to companies table
ALTER TABLE public.companies 
ADD COLUMN theme_mode TEXT DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark', 'auto')),
ADD COLUMN primary_color TEXT DEFAULT '#334155',
ADD COLUMN theme_config JSONB DEFAULT '{}'::jsonb;