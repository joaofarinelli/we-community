-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_modules table
CREATE TABLE public.course_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_lessons table
CREATE TABLE public.course_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  video_url TEXT,
  duration INTEGER DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_course_progress table
CREATE TABLE public.user_course_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses
CREATE POLICY "Users can view active courses in their company" 
ON public.courses 
FOR SELECT 
USING (company_id = public.get_user_company_id() AND is_active = true);

CREATE POLICY "Company owners can create courses" 
ON public.courses 
FOR INSERT 
WITH CHECK (company_id = public.get_user_company_id() AND public.is_company_owner() AND auth.uid() = created_by);

CREATE POLICY "Company owners can update courses" 
ON public.courses 
FOR UPDATE 
USING (company_id = public.get_user_company_id() AND public.is_company_owner());

CREATE POLICY "Company owners can delete courses" 
ON public.courses 
FOR DELETE 
USING (company_id = public.get_user_company_id() AND public.is_company_owner());

-- RLS Policies for course_modules
CREATE POLICY "Users can view modules of accessible courses" 
ON public.course_modules 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.courses 
  WHERE id = course_modules.course_id 
  AND company_id = public.get_user_company_id() 
  AND is_active = true
));

CREATE POLICY "Company owners can create modules" 
ON public.course_modules 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.courses 
  WHERE id = course_modules.course_id 
  AND company_id = public.get_user_company_id() 
  AND public.is_company_owner()
));

CREATE POLICY "Company owners can update modules" 
ON public.course_modules 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.courses 
  WHERE id = course_modules.course_id 
  AND company_id = public.get_user_company_id() 
  AND public.is_company_owner()
));

CREATE POLICY "Company owners can delete modules" 
ON public.course_modules 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.courses 
  WHERE id = course_modules.course_id 
  AND company_id = public.get_user_company_id() 
  AND public.is_company_owner()
));

-- RLS Policies for course_lessons
CREATE POLICY "Users can view lessons of accessible modules" 
ON public.course_lessons 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.course_modules cm
  JOIN public.courses c ON c.id = cm.course_id
  WHERE cm.id = course_lessons.module_id 
  AND c.company_id = public.get_user_company_id() 
  AND c.is_active = true
));

CREATE POLICY "Company owners can create lessons" 
ON public.course_lessons 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.course_modules cm
  JOIN public.courses c ON c.id = cm.course_id
  WHERE cm.id = course_lessons.module_id 
  AND c.company_id = public.get_user_company_id() 
  AND public.is_company_owner()
));

CREATE POLICY "Company owners can update lessons" 
ON public.course_lessons 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.course_modules cm
  JOIN public.courses c ON c.id = cm.course_id
  WHERE cm.id = course_lessons.module_id 
  AND c.company_id = public.get_user_company_id() 
  AND public.is_company_owner()
));

CREATE POLICY "Company owners can delete lessons" 
ON public.course_lessons 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.course_modules cm
  JOIN public.courses c ON c.id = cm.course_id
  WHERE cm.id = course_lessons.module_id 
  AND c.company_id = public.get_user_company_id() 
  AND public.is_company_owner()
));

-- RLS Policies for user_course_progress
CREATE POLICY "Users can view their own progress" 
ON public.user_course_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress" 
ON public.user_course_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM public.course_lessons cl
  JOIN public.course_modules cm ON cm.id = cl.module_id
  JOIN public.courses c ON c.id = cm.course_id
  WHERE cl.id = user_course_progress.lesson_id 
  AND c.company_id = public.get_user_company_id()
));

CREATE POLICY "Users can update their own progress" 
ON public.user_course_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Company owners can view all progress in their company" 
ON public.user_course_progress 
FOR SELECT 
USING (public.is_company_owner() AND EXISTS (
  SELECT 1 FROM public.course_lessons cl
  JOIN public.course_modules cm ON cm.id = cl.module_id
  JOIN public.courses c ON c.id = cm.course_id
  WHERE cl.id = user_course_progress.lesson_id 
  AND c.company_id = public.get_user_company_id()
));

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_modules_updated_at
  BEFORE UPDATE ON public.course_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_lessons_updated_at
  BEFORE UPDATE ON public.course_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_courses_company_id ON public.courses(company_id);
CREATE INDEX idx_courses_is_active ON public.courses(is_active);
CREATE INDEX idx_course_modules_course_id ON public.course_modules(course_id);
CREATE INDEX idx_course_lessons_module_id ON public.course_lessons(module_id);
CREATE INDEX idx_user_course_progress_user_id ON public.user_course_progress(user_id);
CREATE INDEX idx_user_course_progress_lesson_id ON public.user_course_progress(lesson_id);