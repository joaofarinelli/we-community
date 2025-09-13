-- Create RLS policies and remaining database functions

-- Helper function to get user's current company context
CREATE OR REPLACE FUNCTION public.get_current_user_role(company_id UUID)
RETURNS public.user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role 
  FROM public.profiles 
  WHERE user_id = auth.uid() AND profiles.company_id = get_current_user_role.company_id AND is_active = true
  LIMIT 1;
$$;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(company_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role IN ('owner', 'admin')
  FROM public.profiles 
  WHERE user_id = auth.uid() AND profiles.company_id = is_admin.company_id AND is_active = true
  LIMIT 1;
$$;

-- Helper function to get user's company access
CREATE OR REPLACE FUNCTION public.get_user_companies(user_email TEXT DEFAULT NULL)
RETURNS TABLE (
  company_id UUID,
  company_name TEXT,
  user_role public.user_role,
  is_active BOOLEAN
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    p.company_id,
    c.name,
    p.role,
    p.is_active
  FROM public.profiles p
  JOIN public.companies c ON c.id = p.company_id
  WHERE p.user_id = auth.uid() 
    OR (user_email IS NOT NULL AND p.email = user_email)
  ORDER BY p.created_at ASC;
$$;

-- Trigger function to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_company_id UUID;
BEGIN
  -- Try to find a company by extracting domain from email
  SELECT id INTO default_company_id
  FROM public.companies 
  WHERE domain = split_part(NEW.email, '@', 2)
    OR custom_domain = split_part(NEW.email, '@', 2);
  
  -- If no company found by domain, create a profile for the first active company
  IF default_company_id IS NULL THEN
    SELECT id INTO default_company_id
    FROM public.companies 
    WHERE is_active = true 
    ORDER BY created_at ASC 
    LIMIT 1;
  END IF;

  -- Create profile if we have a company
  IF default_company_id IS NOT NULL THEN
    INSERT INTO public.profiles (
      user_id,
      company_id,
      email,
      first_name,
      last_name,
      role
    ) VALUES (
      NEW.id,
      default_company_id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      'user'
    );

    -- Initialize user points
    INSERT INTO public.user_points (
      company_id,
      user_id,
      total_coins,
      available_coins,
      lifetime_coins
    ) VALUES (
      default_company_id,
      NEW.id,
      0,
      0,
      0
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger for auto-profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS POLICIES

-- Companies policies
CREATE POLICY "Companies are viewable by users with profiles" ON public.companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.company_id = companies.id 
        AND profiles.user_id = auth.uid() 
        AND profiles.is_active = true
    )
  );

CREATE POLICY "Admins can update companies" ON public.companies
  FOR UPDATE USING (public.is_admin(id));

-- Profiles policies
CREATE POLICY "Users can view profiles in their companies" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() 
        AND p.company_id = profiles.company_id 
        AND p.is_active = true
    )
  );

CREATE POLICY "Users can update their own profiles" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can update any profile in their company" ON public.profiles
  FOR UPDATE USING (public.is_admin(company_id));

CREATE POLICY "Admins can insert profiles in their company" ON public.profiles
  FOR INSERT WITH CHECK (public.is_admin(company_id));

-- Company settings policies
CREATE POLICY "Users can view company settings" ON public.company_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.company_id = company_settings.company_id 
        AND profiles.user_id = auth.uid() 
        AND profiles.is_active = true
    )
  );

CREATE POLICY "Admins can manage company settings" ON public.company_settings
  FOR ALL USING (public.is_admin(company_id));

-- Categories policies
CREATE POLICY "Users can view categories in their company" ON public.categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.company_id = categories.company_id 
        AND profiles.user_id = auth.uid() 
        AND profiles.is_active = true
    )
  );

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (public.is_admin(company_id));

-- Spaces policies
CREATE POLICY "Users can view spaces in their company" ON public.spaces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.company_id = spaces.company_id 
        AND profiles.user_id = auth.uid() 
        AND profiles.is_active = true
    )
  );

CREATE POLICY "Users can create spaces" ON public.spaces
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.company_id = spaces.company_id 
        AND profiles.user_id = auth.uid() 
        AND profiles.is_active = true
    )
  );

CREATE POLICY "Creators and admins can update spaces" ON public.spaces
  FOR UPDATE USING (
    created_by = auth.uid() OR public.is_admin(company_id)
  );

-- Posts policies
CREATE POLICY "Users can view posts in their company" ON public.posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.company_id = posts.company_id 
        AND profiles.user_id = auth.uid() 
        AND profiles.is_active = true
    )
  );

CREATE POLICY "Users can create posts" ON public.posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.company_id = posts.company_id 
        AND profiles.user_id = auth.uid() 
        AND profiles.is_active = true
    )
  );

CREATE POLICY "Users can update their own posts" ON public.posts
  FOR UPDATE USING (created_by = auth.uid());

-- User points policies
CREATE POLICY "Users can view their own points" ON public.user_points
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all points in their company" ON public.user_points
  FOR SELECT USING (public.is_admin(company_id));

CREATE POLICY "System can update points" ON public.user_points
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin(company_id));

-- Activity logs policies
CREATE POLICY "Users can view their own activity logs" ON public.activity_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all activity logs in their company" ON public.activity_logs
  FOR SELECT USING (public.is_admin(company_id));

CREATE POLICY "System can insert activity logs" ON public.activity_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.company_id = activity_logs.company_id 
        AND profiles.user_id = auth.uid() 
        AND profiles.is_active = true
    )
  );

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage notifications in their company" ON public.notifications
  FOR ALL USING (public.is_admin(company_id));

-- Apply similar patterns for other tables
CREATE POLICY "Company isolation for courses" ON public.courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.company_id = courses.company_id 
        AND profiles.user_id = auth.uid() 
        AND profiles.is_active = true
    )
  );

CREATE POLICY "Company isolation for trails" ON public.trails
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.company_id = trails.company_id 
        AND profiles.user_id = auth.uid() 
        AND profiles.is_active = true
    )
  );

CREATE POLICY "Company isolation for events" ON public.events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.company_id = events.company_id 
        AND profiles.user_id = auth.uid() 
        AND profiles.is_active = true
    )
  );

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_points;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;