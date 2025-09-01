-- Create onboarding system tables

-- Onboarding flows table
CREATE TABLE public.onboarding_flows (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    name TEXT NOT NULL DEFAULT 'Onboarding Padrão',
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT unique_active_flow_per_company UNIQUE (company_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Onboarding steps table
CREATE TABLE public.onboarding_steps (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    flow_id UUID NOT NULL REFERENCES public.onboarding_flows(id) ON DELETE CASCADE,
    step_type TEXT NOT NULL CHECK (step_type IN ('welcome', 'profile', 'spaces', 'tags', 'finish')),
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    config JSONB NOT NULL DEFAULT '{}',
    is_required BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Onboarding assignments table (one per user per flow)
CREATE TABLE public.onboarding_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    flow_id UUID NOT NULL REFERENCES public.onboarding_flows(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    company_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (flow_id, user_id)
);

-- Onboarding step progress table
CREATE TABLE public.onboarding_step_progress (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id UUID NOT NULL REFERENCES public.onboarding_assignments(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES public.onboarding_steps(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
    data JSONB NOT NULL DEFAULT '{}',
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (assignment_id, step_id)
);

-- Create indexes for better performance
CREATE INDEX idx_onboarding_flows_company_active ON public.onboarding_flows(company_id, is_active);
CREATE INDEX idx_onboarding_steps_flow_order ON public.onboarding_steps(flow_id, order_index);
CREATE INDEX idx_onboarding_assignments_user_status ON public.onboarding_assignments(user_id, company_id, status);
CREATE INDEX idx_onboarding_step_progress_assignment ON public.onboarding_step_progress(assignment_id);

-- Enable RLS
ALTER TABLE public.onboarding_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_step_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for onboarding_flows
CREATE POLICY "Company owners can manage onboarding flows" 
ON public.onboarding_flows 
FOR ALL 
USING ((company_id = get_user_company_id()) AND is_company_owner())
WITH CHECK ((company_id = get_user_company_id()) AND is_company_owner() AND (auth.uid() = created_by));

CREATE POLICY "Users can view active flows in their company" 
ON public.onboarding_flows 
FOR SELECT 
USING ((company_id = get_user_company_id()) AND (is_active = true));

-- RLS Policies for onboarding_steps
CREATE POLICY "Company owners can manage onboarding steps" 
ON public.onboarding_steps 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.onboarding_flows f 
    WHERE f.id = onboarding_steps.flow_id 
    AND f.company_id = get_user_company_id() 
    AND is_company_owner()
));

CREATE POLICY "Users can view steps of active flows" 
ON public.onboarding_steps 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.onboarding_flows f 
    WHERE f.id = onboarding_steps.flow_id 
    AND f.company_id = get_user_company_id() 
    AND f.is_active = true
));

-- RLS Policies for onboarding_assignments
CREATE POLICY "Company owners can view all assignments" 
ON public.onboarding_assignments 
FOR SELECT 
USING ((company_id = get_user_company_id()) AND is_company_owner());

CREATE POLICY "Users can view and update their own assignments" 
ON public.onboarding_assignments 
FOR ALL 
USING ((company_id = get_user_company_id()) AND (user_id = auth.uid()))
WITH CHECK ((company_id = get_user_company_id()) AND (user_id = auth.uid()));

CREATE POLICY "System can create assignments" 
ON public.onboarding_assignments 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id());

-- RLS Policies for onboarding_step_progress
CREATE POLICY "Company owners can view all step progress" 
ON public.onboarding_step_progress 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.onboarding_assignments a 
    WHERE a.id = onboarding_step_progress.assignment_id 
    AND a.company_id = get_user_company_id() 
    AND is_company_owner()
));

CREATE POLICY "Users can manage their own step progress" 
ON public.onboarding_step_progress 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.onboarding_assignments a 
    WHERE a.id = onboarding_step_progress.assignment_id 
    AND a.user_id = auth.uid() 
    AND a.company_id = get_user_company_id()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.onboarding_assignments a 
    WHERE a.id = onboarding_step_progress.assignment_id 
    AND a.user_id = auth.uid() 
    AND a.company_id = get_user_company_id()
));

-- Function to handle unique active flow constraint
CREATE OR REPLACE FUNCTION public.ensure_single_active_flow()
RETURNS TRIGGER AS $$
BEGIN
    -- If we're setting a flow to active, deactivate all others in the same company
    IF NEW.is_active = true THEN
        UPDATE public.onboarding_flows 
        SET is_active = false, updated_at = now()
        WHERE company_id = NEW.company_id 
        AND id != NEW.id 
        AND is_active = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to ensure only one active flow per company
CREATE TRIGGER ensure_single_active_flow_trigger
    BEFORE INSERT OR UPDATE ON public.onboarding_flows
    FOR EACH ROW
    WHEN (NEW.is_active = true)
    EXECUTE FUNCTION public.ensure_single_active_flow();

-- Function to auto-assign onboarding to new users
CREATE OR REPLACE FUNCTION public.auto_assign_onboarding()
RETURNS TRIGGER AS $$
DECLARE
    active_flow_id UUID;
BEGIN
    -- Get active onboarding flow for the company
    SELECT id INTO active_flow_id
    FROM public.onboarding_flows
    WHERE company_id = NEW.company_id
    AND is_active = true
    LIMIT 1;
    
    -- If there's an active flow, create assignment
    IF active_flow_id IS NOT NULL THEN
        INSERT INTO public.onboarding_assignments (
            flow_id, user_id, company_id, status
        ) VALUES (
            active_flow_id, NEW.user_id, NEW.company_id, 'pending'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-assign onboarding when new profile is created
CREATE TRIGGER auto_assign_onboarding_trigger
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_onboarding();

-- Add updated_at triggers
CREATE TRIGGER update_onboarding_flows_updated_at
    BEFORE UPDATE ON public.onboarding_flows
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_steps_updated_at
    BEFORE UPDATE ON public.onboarding_steps
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_assignments_updated_at
    BEFORE UPDATE ON public.onboarding_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_step_progress_updated_at
    BEFORE UPDATE ON public.onboarding_step_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();