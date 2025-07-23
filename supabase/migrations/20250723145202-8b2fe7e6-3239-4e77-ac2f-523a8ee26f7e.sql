-- Create space_categories table
CREATE TABLE public.space_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create spaces table
CREATE TABLE public.spaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.space_categories(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'text',
  is_private BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.space_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;

-- RLS Policies for space_categories
CREATE POLICY "Users can view categories in their company" 
ON public.space_categories 
FOR SELECT 
USING (company_id = public.get_user_company_id());

CREATE POLICY "Company owners can create categories" 
ON public.space_categories 
FOR INSERT 
WITH CHECK (company_id = public.get_user_company_id() AND auth.uid() = created_by);

CREATE POLICY "Company owners can update categories" 
ON public.space_categories 
FOR UPDATE 
USING (company_id = public.get_user_company_id() AND public.is_company_owner());

CREATE POLICY "Company owners can delete categories" 
ON public.space_categories 
FOR DELETE 
USING (company_id = public.get_user_company_id() AND public.is_company_owner());

-- RLS Policies for spaces
CREATE POLICY "Users can view spaces in their company" 
ON public.spaces 
FOR SELECT 
USING (company_id = public.get_user_company_id());

CREATE POLICY "Company owners can create spaces" 
ON public.spaces 
FOR INSERT 
WITH CHECK (company_id = public.get_user_company_id() AND auth.uid() = created_by);

CREATE POLICY "Company owners can update spaces" 
ON public.spaces 
FOR UPDATE 
USING (company_id = public.get_user_company_id() AND public.is_company_owner());

CREATE POLICY "Company owners can delete spaces" 
ON public.spaces 
FOR DELETE 
USING (company_id = public.get_user_company_id() AND public.is_company_owner());

-- Create function to automatically create default category when company is created
CREATE OR REPLACE FUNCTION public.create_default_space_category()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.space_categories (company_id, name, order_index, created_by)
  VALUES (NEW.id, 'Espaços', 0, 
    (SELECT user_id FROM public.profiles WHERE company_id = NEW.id AND role = 'owner' LIMIT 1)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic category creation
CREATE TRIGGER create_default_category_on_company_creation
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_space_category();

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_space_categories_updated_at
  BEFORE UPDATE ON public.space_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spaces_updated_at
  BEFORE UPDATE ON public.spaces
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create default category for existing companies
INSERT INTO public.space_categories (company_id, name, order_index, created_by)
SELECT 
  c.id,
  'Espaços',
  0,
  p.user_id
FROM public.companies c
JOIN public.profiles p ON c.id = p.company_id AND p.role = 'owner'
WHERE NOT EXISTS (
  SELECT 1 FROM public.space_categories sc WHERE sc.company_id = c.id
);