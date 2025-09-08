-- Add text_color column to tags table
ALTER TABLE public.tags ADD COLUMN text_color TEXT DEFAULT '#FFFFFF';