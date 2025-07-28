-- Create table for generated reports
CREATE TABLE public.generated_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NULL, -- NULL for global reports
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NULL,
  file_path TEXT NULL,
  file_size INTEGER NULL,
  status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'failed', 'expired')),
  generated_by UUID NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for generated reports
CREATE POLICY "Super admins can view all reports" 
ON public.generated_reports 
FOR SELECT 
USING (is_super_admin());

CREATE POLICY "Super admins can create reports" 
ON public.generated_reports 
FOR INSERT 
WITH CHECK (is_super_admin() AND generated_by = auth.uid());

CREATE POLICY "Super admins can update reports" 
ON public.generated_reports 
FOR UPDATE 
USING (is_super_admin());

CREATE POLICY "Super admins can delete reports" 
ON public.generated_reports 
FOR DELETE 
USING (is_super_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_generated_reports_updated_at
BEFORE UPDATE ON public.generated_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_generated_reports_company_id ON public.generated_reports(company_id);
CREATE INDEX idx_generated_reports_generated_at ON public.generated_reports(generated_at DESC);