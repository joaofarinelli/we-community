-- Add scale response type and document field
ALTER TABLE public.trail_stages 
ADD COLUMN document_url text,
ALTER COLUMN response_type DROP CONSTRAINT trail_stages_response_type_check;

ALTER TABLE public.trail_stages 
ADD CONSTRAINT trail_stages_response_type_check 
CHECK (response_type IN ('text', 'multiple_choice', 'checkbox', 'file_upload', 'image_upload', 'scale'));

COMMENT ON COLUMN public.trail_stages.document_url IS 'URL for guidance document (PDF, DOC, etc.)';
COMMENT ON COLUMN public.trail_stages.response_type IS 'Type of response: text, multiple_choice, checkbox, file_upload, image_upload, scale (0-10)';