-- Add text color configurations to companies table
ALTER TABLE public.companies 
ADD COLUMN text_color TEXT DEFAULT '#F0F3F5',
ADD COLUMN button_text_color TEXT DEFAULT '#FFFFFF';