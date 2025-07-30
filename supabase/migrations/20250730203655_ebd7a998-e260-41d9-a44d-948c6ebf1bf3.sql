-- RLS Policies for trails
DO $$ BEGIN
CREATE POLICY "Users can view their own trails" 
ON public.trails FOR SELECT 
USING (company_id = get_user_company_id() AND user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
CREATE POLICY "Company owners can view all trails" 
ON public.trails FOR SELECT 
USING (company_id = get_user_company_id() AND is_company_owner());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
CREATE POLICY "Users can create their own trails" 
ON public.trails FOR INSERT 
WITH CHECK (company_id = get_user_company_id() AND user_id = auth.uid() AND created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
CREATE POLICY "Company owners can create trails for users" 
ON public.trails FOR INSERT 
WITH CHECK (company_id = get_user_company_id() AND is_company_owner() AND created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
CREATE POLICY "Users can update their own trails" 
ON public.trails FOR UPDATE 
USING (company_id = get_user_company_id() AND user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
CREATE POLICY "Company owners can update all trails" 
ON public.trails FOR UPDATE 
USING (company_id = get_user_company_id() AND is_company_owner());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- RLS Policies for trail templates
DO $$ BEGIN
CREATE POLICY "Company owners can manage templates" 
ON public.trail_templates FOR ALL 
USING (company_id = get_user_company_id() AND is_company_owner())
WITH CHECK (company_id = get_user_company_id() AND is_company_owner() AND created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
CREATE POLICY "Users can view active templates" 
ON public.trail_templates FOR SELECT 
USING (company_id = get_user_company_id() AND is_active = true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- RLS Policies for trail stages
DO $$ BEGIN
CREATE POLICY "Users can view stages of their trails" 
ON public.trail_stages FOR SELECT 
USING (
  (trail_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.trails t 
    WHERE t.id = trail_stages.trail_id 
    AND t.company_id = get_user_company_id() 
    AND (t.user_id = auth.uid() OR is_company_owner())
  )) OR
  (template_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.trail_templates tt 
    WHERE tt.id = trail_stages.template_id 
    AND tt.company_id = get_user_company_id()
  ))
);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
CREATE POLICY "Company owners can manage stages" 
ON public.trail_stages FOR ALL 
USING (
  (trail_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.trails t 
    WHERE t.id = trail_stages.trail_id 
    AND t.company_id = get_user_company_id() 
    AND is_company_owner()
  )) OR
  (template_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.trail_templates tt 
    WHERE tt.id = trail_stages.template_id 
    AND tt.company_id = get_user_company_id() 
    AND is_company_owner()
  ))
);
EXCEPTION WHEN duplicate_object THEN null;
END $$;