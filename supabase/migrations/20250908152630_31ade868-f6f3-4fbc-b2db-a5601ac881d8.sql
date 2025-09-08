-- Create announcements table for message dialogs
CREATE TABLE public.announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  is_mandatory boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true
);

-- Create announcement recipients table
CREATE TABLE public.announcement_recipients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id uuid NOT NULL,
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'viewed', 'dismissed'
  viewed_at timestamp with time zone,
  dismissed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_recipients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for announcements
CREATE POLICY "Company owners can manage announcements" 
ON public.announcements 
FOR ALL 
USING (company_id = get_user_company_id() AND is_company_owner())
WITH CHECK (company_id = get_user_company_id() AND is_company_owner() AND auth.uid() = created_by);

CREATE POLICY "Users can view active announcements in their company" 
ON public.announcements 
FOR SELECT 
USING (company_id = get_user_company_id() AND is_active = true);

-- RLS Policies for announcement recipients
CREATE POLICY "Company owners can view all announcement recipients" 
ON public.announcement_recipients 
FOR SELECT 
USING (company_id = get_user_company_id() AND is_company_owner());

CREATE POLICY "System can create announcement recipients" 
ON public.announcement_recipients 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can view their own announcement recipients" 
ON public.announcement_recipients 
FOR SELECT 
USING (company_id = get_user_company_id() AND user_id = auth.uid());

CREATE POLICY "Users can update their own announcement recipients" 
ON public.announcement_recipients 
FOR UPDATE 
USING (company_id = get_user_company_id() AND user_id = auth.uid());

-- RPC function to get filtered users
CREATE OR REPLACE FUNCTION public.get_company_users_with_filters(
  p_company_id uuid,
  p_search text DEFAULT NULL,
  p_roles text[] DEFAULT NULL,
  p_tag_ids text[] DEFAULT NULL,
  p_joined_start text DEFAULT NULL,
  p_joined_end text DEFAULT NULL,
  p_course_ids text[] DEFAULT NULL,
  p_level_ids text[] DEFAULT NULL,
  p_badge_ids text[] DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
) RETURNS TABLE(
  user_id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  role text,
  joined_at timestamp with time zone,
  tag_ids text[],
  tag_names text[],
  posts_count bigint,
  courses_count bigint,
  level_id uuid,
  level_name text,
  level_color text,
  badge_ids text[],
  badge_names text[]
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_profiles AS (
    SELECT p.user_id, p.first_name, p.last_name, p.email, p.phone, p.role, p.created_at as joined_at
    FROM public.profiles p
    WHERE p.company_id = p_company_id 
    AND p.is_active = true
    AND (p_search IS NULL OR (
      p.first_name ILIKE '%' || p_search || '%' OR 
      p.last_name ILIKE '%' || p_search || '%' OR 
      p.email ILIKE '%' || p_search || '%'
    ))
    AND (p_roles IS NULL OR p.role = ANY(p_roles))
    AND (p_joined_start IS NULL OR p.created_at >= p_joined_start::timestamp)
    AND (p_joined_end IS NULL OR p.created_at <= p_joined_end::timestamp)
  ),
  user_tags AS (
    SELECT ut.user_id, 
           ARRAY_AGG(DISTINCT ut.tag_id::text) as tag_ids,
           ARRAY_AGG(DISTINCT t.name) as tag_names
    FROM public.user_tags ut
    JOIN public.tags t ON t.id = ut.tag_id
    WHERE ut.company_id = p_company_id
    GROUP BY ut.user_id
  ),
  user_badges AS (
    SELECT utb.user_id,
           ARRAY_AGG(DISTINCT utb.badge_id::text) as badge_ids,
           ARRAY_AGG(DISTINCT tb.name) as badge_names
    FROM public.user_trail_badges utb
    JOIN public.trail_badges tb ON tb.id = utb.badge_id
    WHERE utb.company_id = p_company_id
    GROUP BY utb.user_id
  ),
  user_levels AS (
    SELECT ucl.user_id, ucl.current_level_id as level_id,
           ul.level_name, ul.level_color
    FROM public.user_current_level ucl
    JOIN public.user_levels ul ON ul.id = ucl.current_level_id
    WHERE ucl.company_id = p_company_id
  ),
  user_posts AS (
    SELECT p.created_by as user_id, COUNT(*) as posts_count
    FROM public.posts p
    WHERE p.company_id = p_company_id
    GROUP BY p.created_by
  ),
  user_courses AS (
    SELECT uca.user_id, COUNT(DISTINCT uca.course_id) as courses_count
    FROM public.user_course_access uca
    WHERE uca.company_id = p_company_id
    GROUP BY uca.user_id
  )
  SELECT 
    fp.user_id,
    fp.first_name,
    fp.last_name,
    fp.email,
    fp.phone,
    fp.role,
    fp.joined_at,
    COALESCE(ut.tag_ids, ARRAY[]::text[]) as tag_ids,
    COALESCE(ut.tag_names, ARRAY[]::text[]) as tag_names,
    COALESCE(up.posts_count, 0) as posts_count,
    COALESCE(uc.courses_count, 0) as courses_count,
    ul.level_id,
    ul.level_name,
    ul.level_color,
    COALESCE(ub.badge_ids, ARRAY[]::text[]) as badge_ids,
    COALESCE(ub.badge_names, ARRAY[]::text[]) as badge_names
  FROM filtered_profiles fp
  LEFT JOIN user_tags ut ON ut.user_id = fp.user_id
  LEFT JOIN user_badges ub ON ub.user_id = fp.user_id  
  LEFT JOIN user_levels ul ON ul.user_id = fp.user_id
  LEFT JOIN user_posts up ON up.user_id = fp.user_id
  LEFT JOIN user_courses uc ON uc.user_id = fp.user_id
  WHERE (p_tag_ids IS NULL OR ut.tag_ids && p_tag_ids)
  AND (p_level_ids IS NULL OR ul.level_id::text = ANY(p_level_ids))
  AND (p_badge_ids IS NULL OR ub.badge_ids && p_badge_ids)
  ORDER BY fp.joined_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- RPC function for bulk send notifications
CREATE OR REPLACE FUNCTION public.bulk_send_notifications(
  p_company_id uuid,
  p_title text,
  p_content text,
  p_user_ids uuid[]
) RETURNS integer 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  notification_count integer := 0;
  user_id_item uuid;
BEGIN
  -- Verify user is company owner
  IF NOT is_company_owner() THEN
    RAISE EXCEPTION 'Access denied: Company owner required';
  END IF;
  
  -- Insert notifications for each user
  FOREACH user_id_item IN ARRAY p_user_ids
  LOOP
    INSERT INTO public.notifications (user_id, company_id, type, title, content)
    VALUES (user_id_item, p_company_id, 'bulk_action', p_title, p_content);
    notification_count := notification_count + 1;
  END LOOP;
  
  RETURN notification_count;
END;
$$;

-- RPC function for creating announcement and assigning to users
CREATE OR REPLACE FUNCTION public.create_announcement_and_assign(
  p_company_id uuid,
  p_title text,
  p_content text,
  p_is_mandatory boolean,
  p_expires_at timestamp with time zone,
  p_user_ids uuid[]
) RETURNS uuid 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  announcement_id uuid;
  user_id_item uuid;
BEGIN
  -- Verify user is company owner
  IF NOT is_company_owner() THEN
    RAISE EXCEPTION 'Access denied: Company owner required';
  END IF;
  
  -- Create announcement
  INSERT INTO public.announcements (company_id, title, content, is_mandatory, expires_at, created_by)
  VALUES (p_company_id, p_title, p_content, p_is_mandatory, p_expires_at, auth.uid())
  RETURNING id INTO announcement_id;
  
  -- Assign to users
  FOREACH user_id_item IN ARRAY p_user_ids
  LOOP
    INSERT INTO public.announcement_recipients (announcement_id, user_id, company_id)
    VALUES (announcement_id, user_id_item, p_company_id);
  END LOOP;
  
  RETURN announcement_id;
END;
$$;

-- RPC function for bulk grant course access
CREATE OR REPLACE FUNCTION public.bulk_grant_course_access(
  p_company_id uuid,
  p_course_id uuid,
  p_user_ids uuid[]
) RETURNS integer 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  access_count integer := 0;
  user_id_item uuid;
BEGIN
  -- Verify user is company owner
  IF NOT is_company_owner() THEN
    RAISE EXCEPTION 'Access denied: Company owner required';
  END IF;
  
  -- Grant course access to each user
  FOREACH user_id_item IN ARRAY p_user_ids
  LOOP
    INSERT INTO public.user_course_access (user_id, course_id, company_id, granted_by)
    VALUES (user_id_item, p_course_id, p_company_id, auth.uid())
    ON CONFLICT (user_id, course_id) DO NOTHING;
    
    -- Only count if actually inserted (not already had access)
    IF FOUND THEN
      access_count := access_count + 1;
    END IF;
  END LOOP;
  
  RETURN access_count;
END;
$$;

-- RPC function for bulk grant space access
CREATE OR REPLACE FUNCTION public.bulk_grant_space_access(
  p_company_id uuid,
  p_space_id uuid,
  p_user_ids uuid[]
) RETURNS integer 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  access_count integer := 0;
  user_id_item uuid;
BEGIN
  -- Verify user is company owner
  IF NOT is_company_owner() THEN
    RAISE EXCEPTION 'Access denied: Company owner required';
  END IF;
  
  -- Grant space access to each user
  FOREACH user_id_item IN ARRAY p_user_ids
  LOOP
    INSERT INTO public.space_members (space_id, user_id, company_id, role)
    VALUES (p_space_id, user_id_item, p_company_id, 'member')
    ON CONFLICT (space_id, user_id) DO NOTHING;
    
    -- Only count if actually inserted (not already had access)
    IF FOUND THEN
      access_count := access_count + 1;
    END IF;
  END LOOP;
  
  RETURN access_count;
END;
$$;