-- Create bulk_actions table
CREATE TABLE public.bulk_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  action_type TEXT NOT NULL CHECK (action_type IN ('notification', 'announcement', 'course_access', 'space_access')),
  action_config JSONB NOT NULL DEFAULT '{}',
  audience_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bulk_action_executions table
CREATE TABLE public.bulk_action_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bulk_action_id UUID NOT NULL,
  company_id UUID NOT NULL,
  executed_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  total_targets INTEGER NOT NULL DEFAULT 0,
  processed_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bulk_action_results table
CREATE TABLE public.bulk_action_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id UUID NOT NULL,
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.bulk_action_executions 
ADD CONSTRAINT fk_bulk_action_executions_bulk_action_id 
FOREIGN KEY (bulk_action_id) REFERENCES public.bulk_actions(id) ON DELETE CASCADE;

ALTER TABLE public.bulk_action_results 
ADD CONSTRAINT fk_bulk_action_results_execution_id 
FOREIGN KEY (execution_id) REFERENCES public.bulk_action_executions(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.bulk_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_action_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_action_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bulk_actions
CREATE POLICY "Company owners can manage bulk actions"
ON public.bulk_actions FOR ALL
USING (company_id = get_user_company_id() AND is_company_owner())
WITH CHECK (company_id = get_user_company_id() AND is_company_owner() AND auth.uid() = created_by);

CREATE POLICY "Users can view bulk actions in their company"
ON public.bulk_actions FOR SELECT
USING (company_id = get_user_company_id());

-- RLS Policies for bulk_action_executions
CREATE POLICY "Company owners can view all executions"
ON public.bulk_action_executions FOR SELECT
USING (company_id = get_user_company_id() AND is_company_owner());

CREATE POLICY "System can create executions"
ON public.bulk_action_executions FOR INSERT
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "System can update executions"
ON public.bulk_action_executions FOR UPDATE
USING (company_id = get_user_company_id());

-- RLS Policies for bulk_action_results
CREATE POLICY "Company owners can view all results"
ON public.bulk_action_results FOR SELECT
USING (company_id = get_user_company_id() AND is_company_owner());

CREATE POLICY "System can create results"
ON public.bulk_action_results FOR INSERT
WITH CHECK (company_id = get_user_company_id());

-- Add triggers for updated_at
CREATE TRIGGER update_bulk_actions_updated_at
BEFORE UPDATE ON public.bulk_actions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create RPC function to get bulk action targets
CREATE OR REPLACE FUNCTION public.get_bulk_action_targets(
  p_company_id UUID,
  p_audience_config JSONB
)
RETURNS TABLE(user_id UUID, first_name TEXT, last_name TEXT, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If specific users selected
  IF p_audience_config ? 'selected_users' THEN
    RETURN QUERY
    SELECT p.user_id, p.first_name, p.last_name, p.email
    FROM public.profiles p
    WHERE p.company_id = p_company_id
      AND p.is_active = true
      AND p.user_id = ANY(
        (SELECT jsonb_array_elements_text(p_audience_config->'selected_users'))::UUID[]
      );
    RETURN;
  END IF;

  -- Use filters from audience_config
  RETURN QUERY
  SELECT * FROM public.get_company_users_with_filters(
    p_filters => COALESCE(p_audience_config->'filters', '{}'),
    p_limit => 10000,
    p_offset => 0
  );
END;
$$;

-- Create RPC function to preview bulk action
CREATE OR REPLACE FUNCTION public.preview_bulk_action(
  p_company_id UUID,
  p_audience_config JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_count INTEGER;
BEGIN
  -- Check permissions
  IF NOT (get_user_company_id() = p_company_id AND is_company_owner()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Count targets
  SELECT COUNT(*) INTO target_count
  FROM public.get_bulk_action_targets(p_company_id, p_audience_config);

  RETURN jsonb_build_object(
    'target_count', target_count,
    'estimated_processing_time', target_count * 0.1 -- seconds
  );
END;
$$;

-- Create RPC function to execute bulk action
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
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_total_targets INTEGER;
BEGIN
  -- Check permissions
  IF NOT (get_user_company_id() = p_company_id AND is_company_owner()) THEN
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
      -- Execute based on action_type
      CASE v_bulk_action.action_type
        WHEN 'notification' THEN
          INSERT INTO public.notifications (user_id, company_id, type, title, content)
          VALUES (
            v_target.user_id,
            p_company_id,
            'bulk_notification',
            v_bulk_action.action_config->>'title',
            v_bulk_action.action_config->>'content'
          );

        WHEN 'announcement' THEN
          -- Create announcement if not exists, then assign to user
          DECLARE
            v_announcement_id UUID;
          BEGIN
            -- Try to find existing announcement for this bulk action
            SELECT id INTO v_announcement_id
            FROM public.announcements
            WHERE company_id = p_company_id 
              AND title = v_bulk_action.action_config->>'title'
              AND content = v_bulk_action.action_config->>'content'
            LIMIT 1;

            -- Create if not exists
            IF v_announcement_id IS NULL THEN
              INSERT INTO public.announcements (
                company_id, created_by, title, content, is_mandatory, expires_at
              ) VALUES (
                p_company_id,
                auth.uid(),
                v_bulk_action.action_config->>'title',
                v_bulk_action.action_config->>'content',
                COALESCE((v_bulk_action.action_config->>'isMandatory')::BOOLEAN, false),
                CASE WHEN v_bulk_action.action_config ? 'expiresAt' 
                     THEN (v_bulk_action.action_config->>'expiresAt')::TIMESTAMP WITH TIME ZONE
                     ELSE NULL END
              ) RETURNING id INTO v_announcement_id;
            END IF;

            -- Assign to user
            INSERT INTO public.announcement_recipients (announcement_id, user_id, company_id)
            VALUES (v_announcement_id, v_target.user_id, p_company_id)
            ON CONFLICT (announcement_id, user_id) DO NOTHING;
          END;

        WHEN 'course_access' THEN
          INSERT INTO public.user_course_access (user_id, course_id, company_id, granted_by)
          VALUES (
            v_target.user_id,
            (v_bulk_action.action_config->>'courseId')::UUID,
            p_company_id,
            auth.uid()
          ) ON CONFLICT (user_id, course_id) DO NOTHING;

        WHEN 'space_access' THEN
          INSERT INTO public.space_members (space_id, user_id, company_id, role)
          VALUES (
            (v_bulk_action.action_config->>'spaceId')::UUID,
            v_target.user_id,
            p_company_id,
            'member'
          ) ON CONFLICT (space_id, user_id) DO NOTHING;

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
    processed_count = v_success_count + v_error_count,
    success_count = v_success_count,
    error_count = v_error_count,
    completed_at = now()
  WHERE id = v_execution_id;

  RETURN v_execution_id;
END;
$$;