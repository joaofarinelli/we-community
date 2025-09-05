-- Update provision_onboarding_assignment to be idempotent and self-repairing
CREATE OR REPLACE FUNCTION public.provision_onboarding_assignment(p_user_id uuid, p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  active_flow_record RECORD;
  existing_assignment_id uuid;
  new_assignment_id uuid;
  step_record RECORD;
  step_count integer := 0;
BEGIN
  -- Check if user has access to company
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = p_user_id 
    AND company_id = p_company_id 
    AND is_active = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User does not have access to company');
  END IF;

  -- Get active onboarding flow for company
  SELECT * INTO active_flow_record
  FROM public.onboarding_flows
  WHERE company_id = p_company_id AND is_active = true
  LIMIT 1;

  IF active_flow_record.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active onboarding flow found');
  END IF;

  -- Check for existing assignment (pending or in_progress)
  SELECT id INTO existing_assignment_id
  FROM public.onboarding_assignments
  WHERE user_id = p_user_id 
  AND company_id = p_company_id 
  AND flow_id = active_flow_record.id
  AND status IN ('pending', 'in_progress')
  LIMIT 1;

  IF existing_assignment_id IS NOT NULL THEN
    -- Existing assignment found, ensure all step progress records exist
    FOR step_record IN 
      SELECT * FROM public.onboarding_steps 
      WHERE flow_id = active_flow_record.id 
      ORDER BY order_index ASC
    LOOP
      INSERT INTO public.onboarding_step_progress (
        assignment_id, step_id, user_id, company_id, step_type, status
      ) VALUES (
        existing_assignment_id, step_record.id, p_user_id, p_company_id, step_record.step_type, 'pending'
      )
      ON CONFLICT (assignment_id, step_id) DO NOTHING;
      
      step_count := step_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
      'success', true, 
      'assignment_id', existing_assignment_id,
      'flow_id', active_flow_record.id,
      'steps_ensured', step_count,
      'existing', true
    );
  END IF;

  -- No existing assignment, create new one
  INSERT INTO public.onboarding_assignments (
    user_id, company_id, flow_id, status
  ) VALUES (
    p_user_id, p_company_id, active_flow_record.id, 'pending'
  ) RETURNING id INTO new_assignment_id;

  -- Create step progress records for all steps in the flow
  FOR step_record IN 
    SELECT * FROM public.onboarding_steps 
    WHERE flow_id = active_flow_record.id 
    ORDER BY order_index ASC
  LOOP
    INSERT INTO public.onboarding_step_progress (
      assignment_id, step_id, user_id, company_id, step_type, status
    ) VALUES (
      new_assignment_id, step_record.id, p_user_id, p_company_id, step_record.step_type, 'pending'
    );
    
    step_count := step_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true, 
    'assignment_id', new_assignment_id,
    'flow_id', active_flow_record.id,
    'steps_created', step_count,
    'existing', false
  );
END;
$$;

-- Create ensure_onboarding_progress function
CREATE OR REPLACE FUNCTION public.ensure_onboarding_progress(p_assignment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  assignment_record RECORD;
  step_record RECORD;
  steps_added integer := 0;
BEGIN
  -- Get assignment details
  SELECT * INTO assignment_record
  FROM public.onboarding_assignments
  WHERE id = p_assignment_id
  AND user_id = auth.uid(); -- Security check

  IF assignment_record.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Assignment not found or access denied');
  END IF;

  -- Insert missing step progress records
  FOR step_record IN 
    SELECT * FROM public.onboarding_steps 
    WHERE flow_id = assignment_record.flow_id 
    ORDER BY order_index ASC
  LOOP
    INSERT INTO public.onboarding_step_progress (
      assignment_id, step_id, user_id, company_id, step_type, status
    ) VALUES (
      p_assignment_id, step_record.id, assignment_record.user_id, assignment_record.company_id, step_record.step_type, 'pending'
    )
    ON CONFLICT (assignment_id, step_id) DO NOTHING;
    
    IF FOUND THEN
      steps_added := steps_added + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'assignment_id', p_assignment_id,
    'steps_added', steps_added
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.provision_onboarding_assignment(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_onboarding_progress(uuid) TO authenticated;

-- Backfill existing assignments: insert missing step progress records
DO $$
DECLARE
  assignment_record RECORD;
  step_record RECORD;
  backfill_count integer := 0;
BEGIN
  -- For each pending/in_progress assignment
  FOR assignment_record IN 
    SELECT * FROM public.onboarding_assignments 
    WHERE status IN ('pending', 'in_progress')
  LOOP
    -- For each step in the assignment's flow
    FOR step_record IN 
      SELECT * FROM public.onboarding_steps 
      WHERE flow_id = assignment_record.flow_id 
      ORDER BY order_index ASC
    LOOP
      -- Insert missing step progress
      INSERT INTO public.onboarding_step_progress (
        assignment_id, step_id, user_id, company_id, step_type, status
      ) VALUES (
        assignment_record.id, step_record.id, assignment_record.user_id, assignment_record.company_id, step_record.step_type, 'pending'
      )
      ON CONFLICT (assignment_id, step_id) DO NOTHING;
      
      IF FOUND THEN
        backfill_count := backfill_count + 1;
      END IF;
    END LOOP;
  END LOOP;
  
  RAISE LOG 'Backfilled % onboarding step progress records', backfill_count;
END;
$$;