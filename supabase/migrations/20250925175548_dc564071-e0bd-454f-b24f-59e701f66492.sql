-- Create space access rules table to configure granular permissions based on user criteria
CREATE TABLE IF NOT EXISTS public.space_access_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  
  -- Rule configuration
  rule_name text NOT NULL DEFAULT 'Rule',
  rule_type text NOT NULL CHECK (rule_type IN ('create_posts', 'edit_posts', 'delete_posts', 'view_space')),
  
  -- Access criteria (using arrays for multiple values)
  tag_ids text[] DEFAULT '{}',
  level_ids text[] DEFAULT '{}', 
  badge_ids text[] DEFAULT '{}',
  user_roles text[] DEFAULT '{}',
  
  -- Logic for combining criteria (AND vs OR)
  criteria_logic text NOT NULL DEFAULT 'any' CHECK (criteria_logic IN ('any', 'all')),
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  
  -- Constraints
  UNIQUE(space_id, rule_type)
);

-- Enable RLS
ALTER TABLE public.space_access_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Space admins can manage access rules"
ON public.space_access_rules FOR ALL
USING (
  company_id = get_user_company_id() AND (
    is_company_admin() OR
    EXISTS (
      SELECT 1 FROM public.space_members sm
      WHERE sm.space_id = space_access_rules.space_id
      AND sm.user_id = auth.uid()
      AND sm.role = 'admin'
    )
  )
)
WITH CHECK (
  company_id = get_user_company_id() AND (
    is_company_admin() OR
    EXISTS (
      SELECT 1 FROM public.space_members sm
      WHERE sm.space_id = space_access_rules.space_id
      AND sm.user_id = auth.uid()
      AND sm.role = 'admin'
    )
  ) AND
  auth.uid() = created_by
);

-- Users can view access rules for spaces they can access
CREATE POLICY "Users can view access rules for accessible spaces"
ON public.space_access_rules FOR SELECT
USING (
  company_id = get_user_company_id() AND
  can_user_see_space(space_id, auth.uid())
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_space_access_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_space_access_rules_updated_at
  BEFORE UPDATE ON public.space_access_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_space_access_rules_updated_at();

-- Create function to check if user meets space access rule criteria
CREATE OR REPLACE FUNCTION public.check_space_access_rule(
  p_space_id uuid,
  p_user_id uuid,
  p_rule_type text
) RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  rule_record RECORD;
  user_company_id uuid;
  user_role text;
  user_tag_ids text[];
  user_level_id text;
  user_badge_ids text[];
  meets_criteria boolean := false;
BEGIN
  -- Get user's company and basic info
  SELECT company_id, role INTO user_company_id, user_role
  FROM public.profiles
  WHERE user_id = p_user_id AND is_active = true;
  
  IF user_company_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get the access rule for this space and rule type
  SELECT * INTO rule_record
  FROM public.space_access_rules
  WHERE space_id = p_space_id 
  AND rule_type = p_rule_type
  AND company_id = user_company_id;
  
  -- If no rule exists, default to allowing space members and admins
  IF rule_record IS NULL THEN
    -- Company admins always have access
    IF user_role IN ('admin', 'owner') THEN
      RETURN true;
    END IF;
    
    -- Space members have access by default
    RETURN EXISTS (
      SELECT 1 FROM public.space_members sm
      WHERE sm.space_id = p_space_id
      AND sm.user_id = p_user_id
    );
  END IF;
  
  -- Company admins always have access regardless of rules
  IF user_role IN ('admin', 'owner') THEN
    RETURN true;
  END IF;
  
  -- Get user's tags
  SELECT array_agg(tag_id::text) INTO user_tag_ids
  FROM public.user_tags
  WHERE user_id = p_user_id AND company_id = user_company_id;
  
  -- Get user's current level
  SELECT current_level_id::text INTO user_level_id
  FROM public.user_current_level
  WHERE user_id = p_user_id AND company_id = user_company_id;
  
  -- Get user's badges
  SELECT array_agg(badge_id::text) INTO user_badge_ids
  FROM public.user_trail_badges
  WHERE user_id = p_user_id AND company_id = user_company_id;
  
  -- Check criteria based on logic
  IF rule_record.criteria_logic = 'any' THEN
    -- User meets criteria if ANY condition is met
    meets_criteria := (
      -- Check roles
      (array_length(rule_record.user_roles, 1) IS NULL OR user_role = ANY(rule_record.user_roles)) OR
      -- Check tags (overlap)
      (array_length(rule_record.tag_ids, 1) IS NULL OR user_tag_ids && rule_record.tag_ids) OR
      -- Check level
      (array_length(rule_record.level_ids, 1) IS NULL OR user_level_id = ANY(rule_record.level_ids)) OR
      -- Check badges (overlap)
      (array_length(rule_record.badge_ids, 1) IS NULL OR user_badge_ids && rule_record.badge_ids)
    );
  ELSE
    -- User meets criteria if ALL conditions are met (criteria_logic = 'all')
    meets_criteria := (
      -- Check roles (if specified, user must have one of them)
      (array_length(rule_record.user_roles, 1) IS NULL OR user_role = ANY(rule_record.user_roles)) AND
      -- Check tags (if specified, user must have at least one)
      (array_length(rule_record.tag_ids, 1) IS NULL OR user_tag_ids && rule_record.tag_ids) AND
      -- Check level (if specified, user must have one of them)
      (array_length(rule_record.level_ids, 1) IS NULL OR user_level_id = ANY(rule_record.level_ids)) AND
      -- Check badges (if specified, user must have at least one)
      (array_length(rule_record.badge_ids, 1) IS NULL OR user_badge_ids && rule_record.badge_ids)
    );
  END IF;
  
  RETURN meets_criteria;
END;
$$;