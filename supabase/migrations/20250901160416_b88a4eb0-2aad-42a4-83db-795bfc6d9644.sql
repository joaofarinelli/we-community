-- Create segments table
CREATE TABLE public.segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;

-- Create policies for segments
CREATE POLICY "Company owners can manage segments"
ON public.segments
FOR ALL
USING (company_id = get_user_company_id() AND is_company_owner())
WITH CHECK (company_id = get_user_company_id() AND is_company_owner() AND auth.uid() = created_by);

CREATE POLICY "Users can view segments in their company"
ON public.segments
FOR SELECT
USING (company_id = get_user_company_id());

-- Create segment criteria table for defining segment rules
CREATE TABLE public.segment_criteria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  segment_id UUID NOT NULL REFERENCES public.segments(id) ON DELETE CASCADE,
  criteria_type TEXT NOT NULL, -- 'role', 'level', 'tag', 'custom_field', 'date_joined', 'activity'
  criteria_field TEXT, -- field name for custom criteria
  criteria_operator TEXT NOT NULL, -- 'equals', 'contains', 'greater_than', 'less_than', 'in'
  criteria_value JSONB NOT NULL, -- flexible value storage
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.segment_criteria ENABLE ROW LEVEL SECURITY;

-- Create policies for segment criteria
CREATE POLICY "Company owners can manage segment criteria"
ON public.segment_criteria
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.segments s
  WHERE s.id = segment_criteria.segment_id
  AND s.company_id = get_user_company_id()
  AND is_company_owner()
));

CREATE POLICY "Users can view segment criteria in their company"
ON public.segment_criteria
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.segments s
  WHERE s.id = segment_criteria.segment_id
  AND s.company_id = get_user_company_id()
));

-- Create user segments table for manual assignments
CREATE TABLE public.user_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  segment_id UUID NOT NULL REFERENCES public.segments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  assigned_manually BOOLEAN NOT NULL DEFAULT false,
  assigned_by UUID,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(segment_id, user_id)
);

-- Enable RLS
ALTER TABLE public.user_segments ENABLE ROW LEVEL SECURITY;

-- Create policies for user segments
CREATE POLICY "Company owners can manage user segments"
ON public.user_segments
FOR ALL
USING (company_id = get_user_company_id() AND is_company_owner())
WITH CHECK (company_id = get_user_company_id() AND is_company_owner());

CREATE POLICY "Users can view their own segments"
ON public.user_segments
FOR SELECT
USING (company_id = get_user_company_id() AND (user_id = auth.uid() OR is_company_owner()));

-- Create function to update updated_at timestamp
CREATE TRIGGER update_segments_updated_at
BEFORE UPDATE ON public.segments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();