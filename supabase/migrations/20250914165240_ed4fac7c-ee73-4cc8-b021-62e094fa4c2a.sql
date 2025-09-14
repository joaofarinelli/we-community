-- ================================
-- CONTINUING RLS POLICIES IMPLEMENTATION - PART 2
-- ================================

-- ================================
-- LESSON COMPLETION TABLE POLICIES
-- ================================
ALTER TABLE public.lesson_completion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lesson completions" ON public.lesson_completion
FOR SELECT USING (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.course_lessons cl
    JOIN public.course_modules cm ON cm.id = cl.module_id
    JOIN public.courses c ON c.id = cm.course_id
    WHERE cl.id = lesson_id AND c.company_id = public.get_user_company_id()
  )
);

CREATE POLICY "Users can mark their own lesson completions" ON public.lesson_completion
FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.course_lessons cl
    JOIN public.course_modules cm ON cm.id = cl.module_id
    JOIN public.courses c ON c.id = cm.course_id
    WHERE cl.id = lesson_id AND c.company_id = public.get_user_company_id()
  )
);

-- ================================
-- CHALLENGES TABLE POLICIES
-- ================================
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active challenges in their company" ON public.challenges
FOR SELECT USING (
  company_id = public.get_user_company_id() AND
  is_active = true
);

CREATE POLICY "Admins can manage challenges" ON public.challenges
FOR ALL USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- ================================
-- CHALLENGE PROGRESS TABLE POLICIES
-- ================================
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own challenge progress" ON public.challenge_progress
FOR SELECT USING (
  user_id = auth.uid() AND
  company_id = public.get_user_company_id()
);

CREATE POLICY "System can manage challenge progress" ON public.challenge_progress
FOR ALL USING (company_id = public.get_user_company_id());

-- ================================
-- USER CHALLENGE PARTICIPATIONS TABLE POLICIES
-- ================================
ALTER TABLE public.user_challenge_participations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own participations" ON public.user_challenge_participations
FOR SELECT USING (
  user_id = auth.uid() AND
  company_id = public.get_user_company_id()
);

CREATE POLICY "Users can create their own participations" ON public.user_challenge_participations
FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  company_id = public.get_user_company_id()
);

CREATE POLICY "Users can update their own participations" ON public.user_challenge_participations
FOR UPDATE USING (
  user_id = auth.uid() AND
  company_id = public.get_user_company_id()
);

-- ================================
-- CHALLENGE SUBMISSIONS TABLE POLICIES
-- ================================
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own submissions" ON public.challenge_submissions
FOR SELECT USING (
  user_id = auth.uid() AND
  company_id = public.get_user_company_id()
);

CREATE POLICY "Users can create their own submissions" ON public.challenge_submissions
FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  company_id = public.get_user_company_id()
);

CREATE POLICY "Admins can view and manage all submissions" ON public.challenge_submissions
FOR ALL USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- ================================
-- CHALLENGE REWARDS TABLE POLICIES
-- ================================
ALTER TABLE public.challenge_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rewards" ON public.challenge_rewards
FOR SELECT USING (
  user_id = auth.uid() AND
  company_id = public.get_user_company_id()
);

CREATE POLICY "System can manage rewards" ON public.challenge_rewards
FOR ALL USING (company_id = public.get_user_company_id());

-- ================================
-- NOTIFICATIONS TABLE POLICIES
-- ================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (
  user_id = auth.uid() AND
  company_id = public.get_user_company_id()
);

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (
  user_id = auth.uid() AND
  company_id = public.get_user_company_id()
);

CREATE POLICY "System can create notifications" ON public.notifications
FOR INSERT WITH CHECK (company_id = public.get_user_company_id());

-- ================================
-- MARKETPLACE CATEGORIES TABLE POLICIES
-- ================================
ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view marketplace categories in their company" ON public.marketplace_categories
FOR SELECT USING (
  company_id = public.get_user_company_id() AND
  is_active = true
);

CREATE POLICY "Admins can manage marketplace categories" ON public.marketplace_categories
FOR ALL USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- ================================
-- MARKETPLACE ITEMS TABLE POLICIES
-- ================================
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approved marketplace items in their company" ON public.marketplace_items
FOR SELECT USING (
  company_id = public.get_user_company_id() AND
  is_active = true AND
  moderation_status = 'approved'
);

CREATE POLICY "Users can create marketplace items" ON public.marketplace_items
FOR INSERT WITH CHECK (
  company_id = public.get_user_company_id() AND
  created_by = auth.uid()
);

CREATE POLICY "Users can update their own items" ON public.marketplace_items
FOR UPDATE USING (
  company_id = public.get_user_company_id() AND
  created_by = auth.uid()
);

CREATE POLICY "Admins can manage all marketplace items" ON public.marketplace_items
FOR ALL USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- ================================
-- MARKETPLACE PURCHASES TABLE POLICIES
-- ================================
ALTER TABLE public.marketplace_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own purchases" ON public.marketplace_purchases
FOR SELECT USING (
  user_id = auth.uid() AND
  company_id = public.get_user_company_id()
);

CREATE POLICY "Users can create their own purchases" ON public.marketplace_purchases
FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  company_id = public.get_user_company_id()
);

-- ================================
-- EVENTS TABLE POLICIES
-- ================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events in accessible spaces" ON public.events
FOR SELECT USING (
  company_id = public.get_user_company_id() AND
  public.can_user_see_space(space_id)
);

CREATE POLICY "Space admins can manage events" ON public.events
FOR ALL USING (
  company_id = public.get_user_company_id() AND
  (public.is_company_admin() OR
   EXISTS (
     SELECT 1 FROM public.space_members sm
     WHERE sm.space_id = space_id AND sm.user_id = auth.uid() AND sm.role = 'admin'
   ))
);

-- ================================
-- EVENT PARTICIPANTS TABLE POLICIES
-- ================================
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view participants for accessible events" ON public.event_participants
FOR SELECT USING (
  company_id = public.get_user_company_id() AND
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id AND public.can_user_see_space(e.space_id)
  )
);

CREATE POLICY "Users can manage their own event participation" ON public.event_participants
FOR ALL USING (
  user_id = auth.uid() AND
  company_id = public.get_user_company_id()
);

-- ================================
-- ACCESS GROUPS TABLE POLICIES
-- ================================
ALTER TABLE public.access_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view access groups in their company" ON public.access_groups
FOR SELECT USING (
  company_id = public.get_user_company_id() AND
  is_active = true
);

CREATE POLICY "Admins can manage access groups" ON public.access_groups
FOR ALL USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- ================================
-- ACCESS GROUP MEMBERS TABLE POLICIES
-- ================================
ALTER TABLE public.access_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view access group members" ON public.access_group_members
FOR SELECT USING (company_id = public.get_user_company_id());

CREATE POLICY "Admins can manage access group members" ON public.access_group_members
FOR ALL USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- ================================
-- ACCESS GROUP SPACES TABLE POLICIES
-- ================================
ALTER TABLE public.access_group_spaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view access group spaces" ON public.access_group_spaces
FOR SELECT USING (company_id = public.get_user_company_id());

CREATE POLICY "Admins can manage access group spaces" ON public.access_group_spaces
FOR ALL USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- ================================
-- ACCESS GROUP COURSES TABLE POLICIES
-- ================================
ALTER TABLE public.access_group_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view access group courses" ON public.access_group_courses
FOR SELECT USING (company_id = public.get_user_company_id());

CREATE POLICY "Admins can manage access group courses" ON public.access_group_courses
FOR ALL USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- Continue with remaining tables...