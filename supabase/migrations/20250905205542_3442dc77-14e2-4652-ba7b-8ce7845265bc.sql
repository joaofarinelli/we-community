-- Create function to provision onboarding assignment for users
CREATE OR REPLACE FUNCTION public.provision_onboarding_assignment(p_user_id uuid, p_company_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  flow_record RECORD;
  assignment_id uuid;
  step_record RECORD;
BEGIN
  -- Verify user has access to the company
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = p_user_id 
    AND company_id = p_company_id 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'User does not have access to company';
  END IF;

  -- Check if user already has an active assignment
  SELECT id INTO assignment_id
  FROM public.onboarding_assignments
  WHERE user_id = p_user_id 
  AND company_id = p_company_id 
  AND status IN ('pending', 'in_progress')
  LIMIT 1;

  IF assignment_id IS NOT NULL THEN
    RETURN assignment_id;
  END IF;

  -- Get the active onboarding flow for the company
  SELECT * INTO flow_record
  FROM public.onboarding_flows
  WHERE company_id = p_company_id 
  AND is_active = true
  LIMIT 1;

  IF flow_record.id IS NULL THEN
    RAISE EXCEPTION 'No active onboarding flow found for company';
  END IF;

  -- Create new assignment
  INSERT INTO public.onboarding_assignments (
    flow_id, user_id, company_id, status
  ) VALUES (
    flow_record.id, p_user_id, p_company_id, 'pending'
  ) RETURNING id INTO assignment_id;

  -- Create progress records for all steps in the flow
  FOR step_record IN 
    SELECT id FROM public.onboarding_steps
    WHERE flow_id = flow_record.id
    ORDER BY order_index
  LOOP
    INSERT INTO public.onboarding_step_progress (
      assignment_id, step_id, status, data
    ) VALUES (
      assignment_id, step_record.id, 'pending', '{}'::jsonb
    );
  END LOOP;

  RETURN assignment_id;
END;
$function$;

-- Create unique partial index to prevent duplicate active assignments
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_onboarding_assignment
ON public.onboarding_assignments (user_id, company_id)
WHERE status IN ('pending', 'in_progress');

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.provision_onboarding_assignment(uuid, uuid) TO authenticated;