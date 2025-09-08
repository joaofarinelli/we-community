-- Create function to check if user can start a trail based on prerequisites
CREATE OR REPLACE FUNCTION public.can_start_trail(p_user_id uuid, p_company_id uuid, p_template_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  required_templates uuid[];
  prerequisite_id uuid;
BEGIN
  -- Get required trail template IDs from access criteria
  SELECT COALESCE(
    (access_criteria->>'required_trail_template_ids')::text[]::uuid[], 
    ARRAY[]::uuid[]
  ) INTO required_templates
  FROM public.trail_templates
  WHERE id = p_template_id AND company_id = p_company_id;
  
  -- If no prerequisites, user can start
  IF array_length(required_templates, 1) IS NULL OR array_length(required_templates, 1) = 0 THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has completed all prerequisite trails
  FOR prerequisite_id IN SELECT unnest(required_templates)
  LOOP
    -- Check if user has a completed trail for this template
    IF NOT EXISTS (
      SELECT 1 FROM public.trails t
      WHERE t.user_id = p_user_id 
      AND t.company_id = p_company_id
      AND t.template_id = prerequisite_id
      AND (t.status = 'completed' OR t.completed_at IS NOT NULL OR t.progress_percentage = 100)
    ) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$;

-- Add RLS policy to trails table to enforce prerequisites
CREATE POLICY "Users can only start trails if prerequisites are met"
ON public.trails
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id() 
  AND (
    (user_id = auth.uid() AND can_start_trail(user_id, company_id, template_id))
    OR is_company_owner()
  )
);