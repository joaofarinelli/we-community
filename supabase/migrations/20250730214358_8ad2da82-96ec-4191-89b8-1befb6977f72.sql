-- Create trail_stages table
CREATE TABLE public.trail_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trail_id UUID NULL REFERENCES public.trails(id) ON DELETE CASCADE,
  template_id UUID NULL REFERENCES public.trail_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  guidance_text TEXT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT trail_stages_trail_or_template_check CHECK (
    (trail_id IS NOT NULL AND template_id IS NULL) OR 
    (trail_id IS NULL AND template_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.trail_stages ENABLE ROW LEVEL SECURITY;

-- Create policies for trail_stages
CREATE POLICY "Company owners can manage trail stages" 
ON public.trail_stages 
FOR ALL 
USING (
  CASE 
    WHEN trail_id IS NOT NULL THEN
      EXISTS (
        SELECT 1 FROM public.trails t 
        WHERE t.id = trail_stages.trail_id 
        AND t.company_id = get_user_company_id() 
        AND is_company_owner()
      )
    WHEN template_id IS NOT NULL THEN
      EXISTS (
        SELECT 1 FROM public.trail_templates tt 
        WHERE tt.id = trail_stages.template_id 
        AND tt.company_id = get_user_company_id() 
        AND is_company_owner()
      )
    ELSE false
  END
);

CREATE POLICY "Users can view trail stages in their company" 
ON public.trail_stages 
FOR SELECT 
USING (
  CASE 
    WHEN trail_id IS NOT NULL THEN
      EXISTS (
        SELECT 1 FROM public.trails t 
        WHERE t.id = trail_stages.trail_id 
        AND t.company_id = get_user_company_id()
      )
    WHEN template_id IS NOT NULL THEN
      EXISTS (
        SELECT 1 FROM public.trail_templates tt 
        WHERE tt.id = trail_stages.template_id 
        AND tt.company_id = get_user_company_id()
      )
    ELSE false
  END
);

-- Create trigger for updated_at
CREATE TRIGGER update_trail_stages_updated_at
BEFORE UPDATE ON public.trail_stages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_trail_stages_trail_id ON public.trail_stages(trail_id);
CREATE INDEX idx_trail_stages_template_id ON public.trail_stages(template_id);
CREATE INDEX idx_trail_stages_order ON public.trail_stages(order_index);