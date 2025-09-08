-- Update execute_bulk_action function to handle image_url for announcements
CREATE OR REPLACE FUNCTION public.execute_bulk_action(
  p_bulk_action_id UUID,
  p_company_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_execution_id UUID;
  v_bulk_action RECORD;
  v_target RECORD;
  v_total_targets INTEGER;
  v_processed_count INTEGER := 0;
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_announcement_id UUID;
BEGIN
  -- Verify company access
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND company_id = p_company_id 
    AND role IN ('owner', 'admin') 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get bulk action
  SELECT * INTO v_bulk_action
  FROM public.bulk_actions
  WHERE id = p_bulk_action_id AND company_id = p_company_id AND is_active = true;

  IF v_bulk_action.id IS NULL THEN
    RAISE EXCEPTION 'Bulk action not found or inactive';
  END IF;

  -- Count total targets
  SELECT COUNT(*) INTO v_total_targets
  FROM public.get_bulk_action_targets(p_company_id, v_bulk_action.audience_config);

  -- Create execution record
  INSERT INTO public.bulk_action_executions (
    bulk_action_id, company_id, executed_by, total_targets, status
  ) VALUES (
    p_bulk_action_id, p_company_id, auth.uid(), v_total_targets, 'running'
  ) RETURNING id INTO v_execution_id;

  -- Process each target
  FOR v_target IN 
    SELECT * FROM public.get_bulk_action_targets(p_company_id, v_bulk_action.audience_config)
  LOOP
    BEGIN
      v_processed_count := v_processed_count + 1;
      
      CASE v_bulk_action.action_type
        WHEN 'notification' THEN
          -- Create notification
          PERFORM public.bulk_send_notifications(
            ARRAY[v_target.user_id],
            p_company_id,
            v_bulk_action.action_config->>'title',
            v_bulk_action.action_config->>'content'
          );

        WHEN 'announcement' THEN
          -- Create announcement (only once per bulk action)
          IF v_announcement_id IS NULL THEN
            -- Try to find existing announcement for this bulk action
            SELECT id INTO v_announcement_id
            FROM public.announcements 
            WHERE company_id = p_company_id
              AND title = v_bulk_action.action_config->>'title'
              AND content = v_bulk_action.action_config->>'content'
              AND created_by = auth.uid()
              AND created_at >= now() - interval '5 minutes'
            LIMIT 1;
            
            -- Create new announcement if not found
            IF v_announcement_id IS NULL THEN
              INSERT INTO public.announcements (
                company_id, title, content, is_mandatory, expires_at, image_url, created_by
              ) VALUES (
                p_company_id,
                v_bulk_action.action_config->>'title',
                v_bulk_action.action_config->>'content',
                COALESCE((v_bulk_action.action_config->>'isMandatory')::BOOLEAN, false),
                CASE WHEN v_bulk_action.action_config ? 'expiresAt' 
                     THEN (v_bulk_action.action_config->>'expiresAt')::TIMESTAMP WITH TIME ZONE
                     ELSE NULL END,
                v_bulk_action.action_config->>'imageUrl',
                auth.uid()
              ) RETURNING id INTO v_announcement_id;
            END IF;
          END IF;

          -- Add recipient
          INSERT INTO public.announcement_recipients (announcement_id, user_id, company_id)
          VALUES (v_announcement_id, v_target.user_id, p_company_id)
          ON CONFLICT (announcement_id, user_id) DO NOTHING;

        WHEN 'course_access' THEN
          -- Grant course access
          PERFORM public.bulk_grant_course_access(
            ARRAY[v_target.user_id],
            (v_bulk_action.action_config->>'courseId')::UUID,
            p_company_id
          );

        WHEN 'space_access' THEN
          -- Grant space access
          PERFORM public.bulk_grant_space_access(
            ARRAY[v_target.user_id],
            (v_bulk_action.action_config->>'spaceId')::UUID,
            p_company_id
          );

        ELSE
          RAISE EXCEPTION 'Unknown action type: %', v_bulk_action.action_type;
      END CASE;

      -- Record success
      INSERT INTO public.bulk_action_results (execution_id, company_id, user_id, status)
      VALUES (v_execution_id, p_company_id, v_target.user_id, 'success');
      
      v_success_count := v_success_count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Record error
      INSERT INTO public.bulk_action_results (execution_id, company_id, user_id, status, error_message)
      VALUES (v_execution_id, p_company_id, v_target.user_id, 'error', SQLERRM);
      
      v_error_count := v_error_count + 1;
    END;
  END LOOP;

  -- Update execution status
  UPDATE public.bulk_action_executions
  SET 
    status = 'completed',
    processed_count = v_processed_count,
    success_count = v_success_count,
    error_count = v_error_count,
    completed_at = now()
  WHERE id = v_execution_id;

  RETURN v_execution_id;
END;
$$;