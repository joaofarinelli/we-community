-- Add response type and options to trail_stages
ALTER TABLE public.trail_stages 
ADD COLUMN response_type text DEFAULT 'text' CHECK (response_type IN ('text', 'multiple_choice', 'checkbox', 'file_upload', 'image_upload')),
ADD COLUMN response_options jsonb DEFAULT '[]'::jsonb,
ADD COLUMN allow_multiple_files boolean DEFAULT false,
ADD COLUMN max_file_size_mb integer DEFAULT 10,
ADD COLUMN allowed_file_types text[] DEFAULT '{}';

-- Add comments for clarity
COMMENT ON COLUMN public.trail_stages.response_type IS 'Type of response: text, multiple_choice, checkbox, file_upload, image_upload';
COMMENT ON COLUMN public.trail_stages.response_options IS 'JSON array of options for multiple choice/checkbox questions';
COMMENT ON COLUMN public.trail_stages.allow_multiple_files IS 'Whether to allow multiple file uploads';
COMMENT ON COLUMN public.trail_stages.max_file_size_mb IS 'Maximum file size in MB for uploads';
COMMENT ON COLUMN public.trail_stages.allowed_file_types IS 'Array of allowed file extensions (e.g., {pdf, doc, docx})';

-- Update trail_stage_responses to support different response types
ALTER TABLE public.trail_stage_responses 
ADD COLUMN response_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN file_urls text[] DEFAULT '{}';

COMMENT ON COLUMN public.trail_stage_responses.response_data IS 'JSON data for complex responses (multiple choice selections, etc.)';
COMMENT ON COLUMN public.trail_stage_responses.file_urls IS 'Array of uploaded file URLs';