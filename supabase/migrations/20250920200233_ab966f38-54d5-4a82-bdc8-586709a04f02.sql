-- Add order_index column to trail_templates table
ALTER TABLE public.trail_templates 
ADD COLUMN order_index integer NOT NULL DEFAULT 0;

-- Update existing trail_templates with sequential order_index values
-- Based on current created_at order
WITH ordered_templates AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY created_at ASC) - 1 as new_order_index
  FROM public.trail_templates
  WHERE is_active = true
)
UPDATE public.trail_templates 
SET order_index = ordered_templates.new_order_index
FROM ordered_templates
WHERE public.trail_templates.id = ordered_templates.id;

-- Create index for better performance
CREATE INDEX idx_trail_templates_order_index ON public.trail_templates(company_id, order_index);