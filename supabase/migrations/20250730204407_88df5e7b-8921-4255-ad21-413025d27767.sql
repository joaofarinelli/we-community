-- RLS Policies for trail badges
DO $$ BEGIN
CREATE POLICY "Company owners can manage badges" 
ON public.trail_badges FOR ALL 
USING (company_id = get_user_company_id() AND is_company_owner())
WITH CHECK (company_id = get_user_company_id() AND is_company_owner() AND created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
CREATE POLICY "Users can view active badges" 
ON public.trail_badges FOR SELECT 
USING (company_id = get_user_company_id() AND is_active = true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- RLS Policies for user trail badges
DO $$ BEGIN
CREATE POLICY "Users can view their own earned badges" 
ON public.user_trail_badges FOR SELECT 
USING (company_id = get_user_company_id() AND user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
CREATE POLICY "Company owners can view all earned badges" 
ON public.user_trail_badges FOR SELECT 
USING (company_id = get_user_company_id() AND is_company_owner());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
CREATE POLICY "System can award badges" 
ON public.user_trail_badges FOR INSERT 
WITH CHECK (company_id = get_user_company_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Triggers for updating timestamps
DROP TRIGGER IF EXISTS update_trails_updated_at ON public.trails;
CREATE TRIGGER update_trails_updated_at
BEFORE UPDATE ON public.trails
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_trail_templates_updated_at ON public.trail_templates;
CREATE TRIGGER update_trail_templates_updated_at
BEFORE UPDATE ON public.trail_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_trail_stages_updated_at ON public.trail_stages;
CREATE TRIGGER update_trail_stages_updated_at
BEFORE UPDATE ON public.trail_stages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_trail_fields_updated_at ON public.trail_fields;
CREATE TRIGGER update_trail_fields_updated_at
BEFORE UPDATE ON public.trail_fields
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_trail_responses_updated_at ON public.trail_responses;
CREATE TRIGGER update_trail_responses_updated_at
BEFORE UPDATE ON public.trail_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_trail_progress_updated_at ON public.trail_progress;
CREATE TRIGGER update_trail_progress_updated_at
BEFORE UPDATE ON public.trail_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();