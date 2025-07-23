-- Create tags table
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Create policies for tags
CREATE POLICY "Users can view tags in their company" 
ON public.tags 
FOR SELECT 
USING (company_id = get_user_company_id());

CREATE POLICY "Company owners can create tags" 
ON public.tags 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id() AND is_company_owner() AND auth.uid() = created_by);

CREATE POLICY "Company owners can update tags" 
ON public.tags 
FOR UPDATE 
USING (company_id = get_user_company_id() AND is_company_owner());

CREATE POLICY "Company owners can delete tags" 
ON public.tags 
FOR DELETE 
USING (company_id = get_user_company_id() AND is_company_owner());

-- Create trigger for updated_at
CREATE TRIGGER update_tags_updated_at
BEFORE UPDATE ON public.tags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create user_tags table for many-to-many relationship
CREATE TABLE public.user_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tag_id)
);

-- Enable RLS on user_tags
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for user_tags
CREATE POLICY "Users can view user tags in their company" 
ON public.user_tags 
FOR SELECT 
USING (company_id = get_user_company_id());

CREATE POLICY "Company owners can assign tags" 
ON public.user_tags 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id() AND is_company_owner() AND auth.uid() = assigned_by);

CREATE POLICY "Company owners can remove tag assignments" 
ON public.user_tags 
FOR DELETE 
USING (company_id = get_user_company_id() AND is_company_owner());