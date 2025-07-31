-- Add scale response type and document field
ALTER TABLE public.trail_stages 
ADD COLUMN document_url text;

-- Drop old constraint and add new one with scale
ALTER TABLE public.trail_stages 
DROP CONSTRAINT IF EXISTS trail_stages_response_type_check;

ALTER TABLE public.trail_stages 
ADD CONSTRAINT trail_stages_response_type_check 
CHECK (response_type IN ('text', 'multiple_choice', 'checkbox', 'file_upload', 'image_upload', 'scale'));