-- Add pinning fields to trail_templates table
ALTER TABLE public.trail_templates 
ADD COLUMN is_pinned boolean NOT NULL DEFAULT false,
ADD COLUMN pinned_order integer;

-- Create index for better performance on pinned trails
CREATE INDEX idx_trail_templates_pinned ON public.trail_templates (is_pinned DESC, pinned_order ASC NULLS LAST);

-- Create RLS policy for admins to manage pinning
CREATE POLICY "Admins can update pinning status" 
ON public.trail_templates 
FOR UPDATE 
USING (
  company_id = get_user_company_id() 
  AND (
    is_company_owner() 
    OR EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.company_id = trail_templates.company_id 
      AND p.role IN ('owner', 'admin') 
      AND p.is_active = true
    )
  )
);