-- Create user_invites table
CREATE TABLE public.user_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  course_access JSONB DEFAULT '[]'::jsonb,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Create user_course_access table
CREATE TABLE public.user_course_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id, company_id)
);

-- Enable RLS
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_invites
CREATE POLICY "Company owners can create invites" 
ON public.user_invites 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id() AND is_company_owner() AND auth.uid() = invited_by);

CREATE POLICY "Company owners can view company invites" 
ON public.user_invites 
FOR SELECT 
USING (company_id = get_user_company_id() AND is_company_owner());

CREATE POLICY "Company owners can update company invites" 
ON public.user_invites 
FOR UPDATE 
USING (company_id = get_user_company_id() AND is_company_owner());

CREATE POLICY "Public can view invite by token" 
ON public.user_invites 
FOR SELECT 
USING (true);

CREATE POLICY "Public can update invite acceptance" 
ON public.user_invites 
FOR UPDATE 
USING (status = 'pending' AND expires_at > now());

-- RLS Policies for user_course_access
CREATE POLICY "Company owners can manage course access" 
ON public.user_course_access 
FOR ALL 
USING (company_id = get_user_company_id() AND is_company_owner());

CREATE POLICY "Users can view their own course access" 
ON public.user_course_access 
FOR SELECT 
USING (company_id = get_user_company_id() AND user_id = auth.uid());

-- Function to check if user has course access
CREATE OR REPLACE FUNCTION public.user_has_course_access(p_user_id uuid, p_course_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_company_id uuid;
  course_company_id uuid;
BEGIN
  -- Get user's company
  SELECT company_id INTO user_company_id
  FROM public.profiles 
  WHERE user_id = p_user_id;
  
  -- Get course's company
  SELECT company_id INTO course_company_id
  FROM public.courses 
  WHERE id = p_course_id;
  
  -- Must be in same company
  IF user_company_id != course_company_id THEN
    RETURN false;
  END IF;
  
  -- Check if user is company owner (has access to all courses)
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = p_user_id 
    AND company_id = user_company_id 
    AND role IN ('owner', 'admin')
  ) THEN
    RETURN true;
  END IF;
  
  -- Check specific course access
  RETURN EXISTS (
    SELECT 1 FROM public.user_course_access 
    WHERE user_id = p_user_id 
    AND course_id = p_course_id 
    AND company_id = user_company_id
  );
END;
$$;

-- Function to generate secure invite token
CREATE OR REPLACE FUNCTION public.generate_invite_token()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$;

-- Function to process invite acceptance
CREATE OR REPLACE FUNCTION public.process_invite_acceptance(p_token text, p_user_id uuid, p_first_name text, p_last_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  invite_record RECORD;
  course_id_item uuid;
  new_profile_id uuid;
BEGIN
  -- Get invite details
  SELECT * INTO invite_record
  FROM public.user_invites
  WHERE token = p_token 
  AND status = 'pending' 
  AND expires_at > now();
  
  IF invite_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite');
  END IF;
  
  -- Create profile
  INSERT INTO public.profiles (user_id, company_id, first_name, last_name, email, role, is_active)
  VALUES (p_user_id, invite_record.company_id, p_first_name, p_last_name, invite_record.email, invite_record.role, true)
  RETURNING id INTO new_profile_id;
  
  -- Grant course access if specified
  IF jsonb_array_length(invite_record.course_access) > 0 THEN
    FOR course_id_item IN SELECT jsonb_array_elements_text(invite_record.course_access)::uuid
    LOOP
      INSERT INTO public.user_course_access (user_id, course_id, company_id, granted_by)
      VALUES (p_user_id, course_id_item, invite_record.company_id, invite_record.invited_by);
    END LOOP;
  END IF;
  
  -- Mark invite as accepted
  UPDATE public.user_invites 
  SET status = 'accepted', accepted_at = now()
  WHERE id = invite_record.id;
  
  -- Add user to public spaces
  PERFORM public.add_user_to_public_spaces(p_user_id, invite_record.company_id);
  
  RETURN jsonb_build_object(
    'success', true, 
    'company_id', invite_record.company_id,
    'role', invite_record.role
  );
END;
$$;

-- Update courses RLS to use course access function
DROP POLICY IF EXISTS "Users can view active courses in their company" ON public.courses;
CREATE POLICY "Users can view accessible courses" 
ON public.courses 
FOR SELECT 
USING (
  company_id = get_user_company_id() 
  AND is_active = true 
  AND public.user_has_course_access(auth.uid(), id)
);