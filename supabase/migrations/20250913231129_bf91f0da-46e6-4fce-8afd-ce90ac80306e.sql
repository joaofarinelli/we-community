-- Create missing tables that the codebase expects

-- Space categories table
CREATE TABLE IF NOT EXISTS public.space_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT,
  created_by UUID,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.space_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for space_categories
CREATE POLICY "Users can view categories in their company" 
ON public.space_categories 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.company_id = space_categories.company_id 
  AND profiles.is_active = true
));

CREATE POLICY "Admins can manage categories" 
ON public.space_categories 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.company_id = space_categories.company_id 
  AND profiles.role IN ('admin', 'owner')
  AND profiles.is_active = true
));

-- Spaces table
CREATE TABLE IF NOT EXISTS public.spaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  space_category_id UUID REFERENCES public.space_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  title TEXT,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;

-- RLS policies for spaces
CREATE POLICY "Users can view spaces in their company" 
ON public.spaces 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.company_id = spaces.company_id 
  AND profiles.is_active = true
));

CREATE POLICY "Admins can manage spaces" 
ON public.spaces 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.company_id = spaces.company_id 
  AND profiles.role IN ('admin', 'owner')
  AND profiles.is_active = true
));

-- Courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- RLS policies for courses
CREATE POLICY "Users can view courses in their company" 
ON public.courses 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.company_id = courses.company_id 
  AND profiles.is_active = true
));

CREATE POLICY "Admins can manage courses" 
ON public.courses 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.company_id = courses.company_id 
  AND profiles.role IN ('admin', 'owner')
  AND profiles.is_active = true
));

-- User levels table
CREATE TABLE IF NOT EXISTS public.user_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  level_name TEXT NOT NULL,
  level_number INTEGER NOT NULL,
  points_required INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, level_number)
);

-- Enable RLS
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_levels
CREATE POLICY "Users can view levels in their company" 
ON public.user_levels 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.company_id = user_levels.company_id 
  AND profiles.is_active = true
));

CREATE POLICY "Admins can manage levels" 
ON public.user_levels 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.company_id = user_levels.company_id 
  AND profiles.role IN ('admin', 'owner')
  AND profiles.is_active = true
));

-- Trails table
CREATE TABLE IF NOT EXISTS public.trails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  description TEXT,
  status TEXT DEFAULT 'draft',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trails ENABLE ROW LEVEL SECURITY;

-- RLS policies for trails
CREATE POLICY "Users can view trails in their company" 
ON public.trails 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.company_id = trails.company_id 
  AND profiles.is_active = true
));

CREATE POLICY "Admins can manage trails" 
ON public.trails 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.company_id = trails.company_id 
  AND profiles.role IN ('admin', 'owner')
  AND profiles.is_active = true
));

-- Access groups table (referenced in AccessGroupAccessTab)
CREATE TABLE IF NOT EXISTS public.access_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.access_groups ENABLE ROW LEVEL SECURITY;

-- RLS policies for access_groups
CREATE POLICY "Users can view access groups in their company" 
ON public.access_groups 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.company_id = access_groups.company_id 
  AND profiles.is_active = true
));

CREATE POLICY "Admins can manage access groups" 
ON public.access_groups 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.company_id = access_groups.company_id 
  AND profiles.role IN ('admin', 'owner')
  AND profiles.is_active = true
));

-- Add triggers for updated_at columns
CREATE TRIGGER update_space_categories_updated_at
  BEFORE UPDATE ON public.space_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spaces_updated_at
  BEFORE UPDATE ON public.spaces
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_levels_updated_at
  BEFORE UPDATE ON public.user_levels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trails_updated_at
  BEFORE UPDATE ON public.trails
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_access_groups_updated_at
  BEFORE UPDATE ON public.access_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();