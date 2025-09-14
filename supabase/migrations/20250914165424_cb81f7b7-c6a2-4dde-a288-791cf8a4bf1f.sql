-- ================================
-- CONTINUING RLS POLICIES IMPLEMENTATION - PART 3 (FINAL CORE TABLES)
-- ================================

-- ================================
-- LESSON RELATED TABLES
-- ================================

-- LESSON LIKES
ALTER TABLE public.lesson_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lesson likes from accessible courses" ON public.lesson_likes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.course_lessons cl
    JOIN public.course_modules cm ON cm.id = cl.module_id
    JOIN public.courses c ON c.id = cm.course_id
    WHERE cl.id = lesson_id 
    AND c.company_id = public.get_user_company_id()
    AND public.user_has_access_to_course(c.id)
  )
);

CREATE POLICY "Users can like lessons from accessible courses" ON public.lesson_likes
FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.course_lessons cl
    JOIN public.course_modules cm ON cm.id = cl.module_id
    JOIN public.courses c ON c.id = cm.course_id
    WHERE cl.id = lesson_id 
    AND c.company_id = public.get_user_company_id()
    AND public.user_has_access_to_course(c.id)
  )
);

CREATE POLICY "Users can manage their own lesson likes" ON public.lesson_likes
FOR DELETE USING (user_id = auth.uid());

-- LESSON NOTES
ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lesson notes" ON public.lesson_notes
FOR SELECT USING (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.course_lessons cl
    JOIN public.course_modules cm ON cm.id = cl.module_id
    JOIN public.courses c ON c.id = cm.course_id
    WHERE cl.id = lesson_id AND c.company_id = public.get_user_company_id()
  )
);

CREATE POLICY "Users can create their own lesson notes" ON public.lesson_notes
FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.course_lessons cl
    JOIN public.course_modules cm ON cm.id = cl.module_id
    JOIN public.courses c ON c.id = cm.course_id
    WHERE cl.id = lesson_id AND c.company_id = public.get_user_company_id()
  )
);

CREATE POLICY "Users can update their own lesson notes" ON public.lesson_notes
FOR UPDATE USING (user_id = auth.uid());

-- LESSON MATERIALS
ALTER TABLE public.lesson_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lesson materials from accessible courses" ON public.lesson_materials
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.course_lessons cl
    JOIN public.course_modules cm ON cm.id = cl.module_id
    JOIN public.courses c ON c.id = cm.course_id
    WHERE cl.id = lesson_id 
    AND c.company_id = public.get_user_company_id()
    AND public.user_has_access_to_course(c.id)
  )
);

CREATE POLICY "Admins can manage lesson materials" ON public.lesson_materials
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.course_lessons cl
    JOIN public.course_modules cm ON cm.id = cl.module_id
    JOIN public.courses c ON c.id = cm.course_id
    WHERE cl.id = lesson_id 
    AND c.company_id = public.get_user_company_id()
    AND public.is_company_admin()
  )
);

-- ================================
-- USER INTERACTION TABLES
-- ================================

-- CONVERSATIONS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversations they participate in" ON public.conversations
FOR SELECT USING (
  company_id = public.get_user_company_id() AND
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = id AND cp.user_id = auth.uid()
  )
);

-- CONVERSATION PARTICIPANTS
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view participants of their conversations" ON public.conversation_participants
FOR SELECT USING (
  company_id = public.get_user_company_id() AND
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp2
    WHERE cp2.conversation_id = conversation_id AND cp2.user_id = auth.uid()
  )
);

-- MESSAGES
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from their conversations" ON public.messages
FOR SELECT USING (
  company_id = public.get_user_company_id() AND
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to their conversations" ON public.messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  company_id = public.get_user_company_id() AND
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
  )
);

-- ================================
-- GAMIFICATION TABLES
-- ================================

-- POINT TRANSACTIONS
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own point transactions" ON public.point_transactions
FOR SELECT USING (
  user_id = auth.uid() AND
  company_id = public.get_user_company_id()
);

CREATE POLICY "System can manage point transactions" ON public.point_transactions
FOR ALL USING (company_id = public.get_user_company_id());

-- USER STREAKS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own streaks" ON public.user_streaks
FOR SELECT USING (
  user_id = auth.uid() AND
  company_id = public.get_user_company_id()
);

CREATE POLICY "System can manage user streaks" ON public.user_streaks
FOR ALL USING (company_id = public.get_user_company_id());

-- USER LEVELS
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view user levels in their company" ON public.user_levels
FOR SELECT USING (company_id = public.get_user_company_id());

CREATE POLICY "Admins can manage user levels" ON public.user_levels
FOR ALL USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- ================================
-- SPACE CATEGORIES
-- ================================
ALTER TABLE public.space_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view space categories in their company" ON public.space_categories
FOR SELECT USING (company_id = public.get_user_company_id());

CREATE POLICY "Admins can manage space categories" ON public.space_categories
FOR ALL USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- ================================
-- BUG REPORTS
-- ================================
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bug reports" ON public.bug_reports
FOR SELECT USING (
  user_id = auth.uid() AND
  company_id = public.get_user_company_id()
);

CREATE POLICY "Users can create bug reports" ON public.bug_reports
FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  company_id = public.get_user_company_id()
);

CREATE POLICY "Admins can manage all bug reports" ON public.bug_reports
FOR ALL USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- ================================
-- ANNOUNCEMENTS
-- ================================
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active announcements in their company" ON public.announcements
FOR SELECT USING (
  company_id = public.get_user_company_id() AND
  is_active = true AND
  (expires_at IS NULL OR expires_at > now())
);

CREATE POLICY "Admins can manage announcements" ON public.announcements
FOR ALL USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- ANNOUNCEMENT RECIPIENTS
ALTER TABLE public.announcement_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own announcement status" ON public.announcement_recipients
FOR SELECT USING (
  user_id = auth.uid() AND
  company_id = public.get_user_company_id()
);

CREATE POLICY "Users can update their own announcement status" ON public.announcement_recipients
FOR UPDATE USING (
  user_id = auth.uid() AND
  company_id = public.get_user_company_id()
);

-- ================================
-- GENERATED REPORTS
-- ================================
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports" ON public.generated_reports
FOR SELECT USING (
  generated_by = auth.uid() AND
  (company_id IS NULL OR company_id = public.get_user_company_id())
);

CREATE POLICY "Admins can view all company reports" ON public.generated_reports
FOR SELECT USING (
  company_id = public.get_user_company_id() AND
  public.is_company_admin()
);

CREATE POLICY "Users can create reports" ON public.generated_reports
FOR INSERT WITH CHECK (
  generated_by = auth.uid() AND
  (company_id IS NULL OR company_id = public.get_user_company_id())
);

-- ================================
-- MONTHLY RANKINGS
-- ================================
ALTER TABLE public.monthly_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view monthly rankings in their company" ON public.monthly_rankings
FOR SELECT USING (company_id = public.get_user_company_id());