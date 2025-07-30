-- Check if we have the correct policies and add them if missing
DROP POLICY IF EXISTS "Company owners can manage trail stages" ON public.trail_stages;
DROP POLICY IF EXISTS "Users can view trail stages in their company" ON public.trail_stages;

-- Create policies for trail_stages
CREATE POLICY "Company owners can manage trail stages" 
ON public.trail_stages 
FOR ALL 
USING (
  CASE 
    WHEN trail_id IS NOT NULL THEN
      EXISTS (
        SELECT 1 FROM public.trails t 
        WHERE t.id = trail_stages.trail_id 
        AND t.company_id = get_user_company_id() 
        AND is_company_owner()
      )
    WHEN template_id IS NOT NULL THEN
      EXISTS (
        SELECT 1 FROM public.trail_templates tt 
        WHERE tt.id = trail_stages.template_id 
        AND tt.company_id = get_user_company_id() 
        AND is_company_owner()
      )
    ELSE false
  END
)
WITH CHECK (
  CASE 
    WHEN trail_id IS NOT NULL THEN
      EXISTS (
        SELECT 1 FROM public.trails t 
        WHERE t.id = trail_stages.trail_id 
        AND t.company_id = get_user_company_id() 
        AND is_company_owner()
      )
    WHEN template_id IS NOT NULL THEN
      EXISTS (
        SELECT 1 FROM public.trail_templates tt 
        WHERE tt.id = trail_stages.template_id 
        AND tt.company_id = get_user_company_id() 
        AND is_company_owner()
      )
    ELSE false
  END
);

CREATE POLICY "Users can view trail stages in their company" 
ON public.trail_stages 
FOR SELECT 
USING (
  CASE 
    WHEN trail_id IS NOT NULL THEN
      EXISTS (
        SELECT 1 FROM public.trails t 
        WHERE t.id = trail_stages.trail_id 
        AND t.company_id = get_user_company_id()
      )
    WHEN template_id IS NOT NULL THEN
      EXISTS (
        SELECT 1 FROM public.trail_templates tt 
        WHERE tt.id = trail_stages.template_id 
        AND tt.company_id = get_user_company_id()
      )
    ELSE false
  END
);