-- Add icon fields to tags table
ALTER TABLE public.tags 
ADD COLUMN icon_type TEXT DEFAULT 'none' CHECK (icon_type IN ('none', 'emoji', 'image')),
ADD COLUMN icon_value TEXT;