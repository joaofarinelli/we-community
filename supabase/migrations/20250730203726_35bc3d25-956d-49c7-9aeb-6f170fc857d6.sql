-- RLS Policies for trail fields
DO $$ BEGIN
CREATE POLICY "Users can view fields of accessible stages" 
ON public.trail_fields FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.trail_stages ts 
  WHERE ts.id = trail_fields.stage_id 
  AND (
    (ts.trail_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.trails t 
      WHERE t.id = ts.trail_id 
      AND t.company_id = get_user_company_id() 
      AND (t.user_id = auth.uid() OR is_company_owner())
    )) OR
    (ts.template_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.trail_templates tt 
      WHERE tt.id = ts.template_id 
      AND tt.company_id = get_user_company_id()
    ))
  )
));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
CREATE POLICY "Company owners can manage fields" 
ON public.trail_fields FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.trail_stages ts 
  WHERE ts.id = trail_fields.stage_id 
  AND (
    (ts.trail_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.trails t 
      WHERE t.id = ts.trail_id 
      AND t.company_id = get_user_company_id() 
      AND is_company_owner()
    )) OR
    (ts.template_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.trail_templates tt 
      WHERE tt.id = ts.template_id 
      AND tt.company_id = get_user_company_id() 
      AND is_company_owner()
    ))
  )
));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- RLS Policies for trail responses
DO $$ BEGIN
CREATE POLICY "Users can manage their own responses" 
ON public.trail_responses FOR ALL 
USING (company_id = get_user_company_id() AND user_id = auth.uid())
WITH CHECK (company_id = get_user_company_id() AND user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
CREATE POLICY "Company owners can view all responses" 
ON public.trail_responses FOR SELECT 
USING (company_id = get_user_company_id() AND is_company_owner());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- RLS Policies for trail progress
DO $$ BEGIN
CREATE POLICY "Users can view their own progress" 
ON public.trail_progress FOR SELECT 
USING (company_id = get_user_company_id() AND user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
CREATE POLICY "Company owners can view all progress" 
ON public.trail_progress FOR SELECT 
USING (company_id = get_user_company_id() AND is_company_owner());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
CREATE POLICY "System can manage progress" 
ON public.trail_progress FOR ALL 
USING (company_id = get_user_company_id())
WITH CHECK (company_id = get_user_company_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;