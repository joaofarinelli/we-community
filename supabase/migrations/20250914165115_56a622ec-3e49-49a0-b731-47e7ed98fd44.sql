-- ================================
-- COMPREHENSIVE RLS POLICIES IMPLEMENTATION
-- ================================

-- First, create essential security definer functions
-- These functions bypass RLS and provide secure access patterns

-- Function to get user's company ID from context or profile
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid AS $$
DECLARE
  company_id uuid;
BEGIN
  -- First try to get from session context (set by useSupabaseContext)
  SELECT current_setting('app.current_company_id', true) INTO company_id;
  
  -- If not found in context, get from user profile
  IF company_id IS NULL OR company_id = '' THEN
    SELECT p.company_id INTO company_id
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
    LIMIT 1;
  END IF;
  
  RETURN company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is company admin/owner
CREATE OR REPLACE FUNCTION public.is_company_admin()
RETURNS boolean AS $$
DECLARE
  user_company_id uuid;
  is_admin boolean := false;
BEGIN
  user_company_id := public.get_user_company_id();
  
  IF user_company_id IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND company_id = user_company_id
    AND role IN ('admin', 'owner')
    AND is_active = true
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user can see a space (public/private/groups)
CREATE OR REPLACE FUNCTION public.can_user_see_space(space_id uuid)
RETURNS boolean AS $$
DECLARE
  space_visibility text;
  user_company_id uuid;
  has_access boolean := false;
BEGIN
  user_company_id := public.get_user_company_id();
  
  -- Get space visibility
  SELECT visibility INTO space_visibility
  FROM public.spaces s
  WHERE s.id = space_id AND s.company_id = user_company_id;
  
  -- Public spaces are visible to all company members
  IF space_visibility = 'public' THEN
    RETURN true;
  END IF;
  
  -- Check if user is direct member
  SELECT EXISTS (
    SELECT 1 FROM public.space_members sm
    WHERE sm.space_id = space_id 
    AND sm.user_id = auth.uid()
    AND sm.company_id = user_company_id
  ) INTO has_access;
  
  IF has_access THEN
    RETURN true;
  END IF;
  
  -- Check if user has access through access groups
  SELECT EXISTS (
    SELECT 1 FROM public.access_group_members agm
    JOIN public.access_group_spaces ags ON ags.access_group_id = agm.access_group_id
    WHERE ags.space_id = space_id
    AND agm.user_id = auth.uid()
    AND agm.company_id = user_company_id
  ) INTO has_access;
  
  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user has access to course
CREATE OR REPLACE FUNCTION public.user_has_access_to_course(course_id uuid)
RETURNS boolean AS $$
DECLARE
  user_company_id uuid;
  has_access boolean := false;
BEGIN
  user_company_id := public.get_user_company_id();
  
  -- Check if course belongs to user's company
  IF NOT EXISTS (
    SELECT 1 FROM public.courses c 
    WHERE c.id = course_id AND c.company_id = user_company_id
  ) THEN
    RETURN false;
  END IF;
  
  -- Check if user has access through access groups
  SELECT EXISTS (
    SELECT 1 FROM public.access_group_members agm
    JOIN public.access_group_courses agc ON agc.access_group_id = agm.access_group_id
    WHERE agc.course_id = course_id
    AND agm.user_id = auth.uid()
    AND agm.company_id = user_company_id
  ) INTO has_access;
  
  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ================================
-- COMPANIES TABLE POLICIES
-- ================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies are viewable by members" ON public.companies
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.company_id = id AND p.is_active = true
  )
);

CREATE POLICY "Only owners can update companies" ON public.companies
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.company_id = id AND p.role = 'owner' AND p.is_active = true
  )
);

-- ================================
-- PROFILES TABLE POLICIES  
-- ================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view profiles in their company" ON public.profiles
FOR SELECT USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can create their own profile" ON public.profiles
FOR INSERT WITH CHECK (user_id = auth.uid() AND company_id = public.get_user_company_id());

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (user_id = auth.uid() AND company_id = public.get_user_company_id());

CREATE POLICY "Admins can update any profile in company" ON public.profiles
FOR UPDATE USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- ================================
-- USER POINTS TABLE POLICIES
-- ================================
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view points in their company" ON public.user_points
FOR SELECT USING (company_id = public.get_user_company_id());

CREATE POLICY "System can manage user points" ON public.user_points
FOR ALL USING (company_id = public.get_user_company_id());

-- ================================
-- SPACES TABLE POLICIES
-- ================================
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view spaces they have access to" ON public.spaces
FOR SELECT USING (
  company_id = public.get_user_company_id() AND
  public.can_user_see_space(id)
);

CREATE POLICY "Admins can manage spaces" ON public.spaces
FOR ALL USING (company_id = public.get_user_company_id() AND public.is_company_admin());

CREATE POLICY "Space admins can update their spaces" ON public.spaces
FOR UPDATE USING (
  company_id = public.get_user_company_id() AND
  EXISTS (
    SELECT 1 FROM public.space_members sm
    WHERE sm.space_id = id AND sm.user_id = auth.uid() AND sm.role = 'admin'
  )
);

-- ================================
-- SPACE MEMBERS TABLE POLICIES
-- ================================
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view space members for accessible spaces" ON public.space_members
FOR SELECT USING (
  company_id = public.get_user_company_id() AND
  public.can_user_see_space(space_id)
);

CREATE POLICY "Space admins can manage members" ON public.space_members
FOR ALL USING (
  company_id = public.get_user_company_id() AND
  (public.is_company_admin() OR 
   EXISTS (
     SELECT 1 FROM public.space_members sm
     WHERE sm.space_id = space_id AND sm.user_id = auth.uid() AND sm.role = 'admin'
   ))
);

-- ================================
-- POSTS TABLE POLICIES
-- ================================
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view posts in accessible spaces" ON public.posts
FOR SELECT USING (
  company_id = public.get_user_company_id() AND
  public.can_user_see_space(space_id)
);

CREATE POLICY "Users can create posts in accessible spaces" ON public.posts
FOR INSERT WITH CHECK (
  company_id = public.get_user_company_id() AND
  author_id = auth.uid() AND
  public.can_user_see_space(space_id)
);

CREATE POLICY "Users can update their own posts" ON public.posts
FOR UPDATE USING (
  company_id = public.get_user_company_id() AND
  author_id = auth.uid()
);

CREATE POLICY "Users can delete their own posts" ON public.posts
FOR DELETE USING (
  company_id = public.get_user_company_id() AND
  (author_id = auth.uid() OR public.is_company_admin())
);

-- ================================
-- POST INTERACTIONS TABLE POLICIES
-- ================================
ALTER TABLE public.post_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view interactions on accessible posts" ON public.post_interactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = post_id 
    AND p.company_id = public.get_user_company_id()
    AND public.can_user_see_space(p.space_id)
  )
);

CREATE POLICY "Users can create interactions on accessible posts" ON public.post_interactions
FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = post_id 
    AND p.company_id = public.get_user_company_id()
    AND public.can_user_see_space(p.space_id)
  )
);

CREATE POLICY "Users can manage their own interactions" ON public.post_interactions
FOR ALL USING (user_id = auth.uid());

-- ================================
-- COURSES TABLE POLICIES
-- ================================
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view courses they have access to" ON public.courses
FOR SELECT USING (
  company_id = public.get_user_company_id() AND
  (is_active = true AND public.user_has_access_to_course(id))
);

CREATE POLICY "Admins can manage courses" ON public.courses
FOR ALL USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- ================================
-- COURSE MODULES TABLE POLICIES
-- ================================
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view modules of accessible courses" ON public.course_modules
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_id 
    AND c.company_id = public.get_user_company_id()
    AND public.user_has_access_to_course(c.id)
  )
);

CREATE POLICY "Admins can manage course modules" ON public.course_modules
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_id 
    AND c.company_id = public.get_user_company_id()
    AND public.is_company_admin()
  )
);

-- ================================
-- COURSE LESSONS TABLE POLICIES
-- ================================
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lessons of accessible courses" ON public.course_lessons
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.course_modules cm
    JOIN public.courses c ON c.id = cm.course_id
    WHERE cm.id = module_id
    AND c.company_id = public.get_user_company_id()
    AND public.user_has_access_to_course(c.id)
  )
);

CREATE POLICY "Admins can manage course lessons" ON public.course_lessons
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.course_modules cm
    JOIN public.courses c ON c.id = cm.course_id
    WHERE cm.id = module_id
    AND c.company_id = public.get_user_company_id()
    AND public.is_company_admin()
  )
);

-- Continue with remaining tables in next part...