-- Add access criteria fields to trail_templates table
ALTER TABLE public.trail_templates 
ADD COLUMN access_criteria jsonb DEFAULT '{}'::jsonb;

-- Update existing trail_templates to have default access criteria
UPDATE public.trail_templates 
SET access_criteria = '{}'::jsonb 
WHERE access_criteria IS NULL;