-- Create custom profile fields table
CREATE TABLE public.custom_profile_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text', -- text, textarea, select, number, date
  field_options JSONB DEFAULT '{}', -- for select options, validation rules, etc
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, field_name)
);

-- Create user custom profile data table
CREATE TABLE public.user_custom_profile_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  field_id UUID NOT NULL REFERENCES public.custom_profile_fields(id) ON DELETE CASCADE,
  field_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id, field_id)
);

-- Enable RLS
ALTER TABLE public.custom_profile_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_custom_profile_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_profile_fields
CREATE POLICY "Company owners can manage custom fields" 
ON public.custom_profile_fields 
FOR ALL 
USING (company_id = get_user_company_id() AND is_company_owner())
WITH CHECK (company_id = get_user_company_id() AND is_company_owner() AND auth.uid() = created_by);

CREATE POLICY "Users can view active custom fields in their company" 
ON public.custom_profile_fields 
FOR SELECT 
USING (company_id = get_user_company_id() AND is_active = true);

-- RLS Policies for user_custom_profile_data
CREATE POLICY "Users can manage their own custom profile data" 
ON public.user_custom_profile_data 
FOR ALL 
USING (company_id = get_user_company_id() AND user_id = auth.uid())
WITH CHECK (company_id = get_user_company_id() AND user_id = auth.uid());

CREATE POLICY "Company owners can view all custom profile data" 
ON public.user_custom_profile_data 
FOR SELECT 
USING (company_id = get_user_company_id() AND is_company_owner());

-- Add update trigger for timestamps
CREATE TRIGGER update_custom_profile_fields_updated_at
BEFORE UPDATE ON public.custom_profile_fields
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_custom_profile_data_updated_at
BEFORE UPDATE ON public.user_custom_profile_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();