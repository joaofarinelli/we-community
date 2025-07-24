-- Create lesson_favorites table
CREATE TABLE public.lesson_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lesson_id, user_id)
);

-- Enable RLS
ALTER TABLE public.lesson_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view favorites on lessons they have access to"
ON public.lesson_favorites FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM course_lessons cl
    JOIN course_modules cm ON cm.id = cl.module_id
    JOIN courses c ON c.id = cm.course_id
    WHERE cl.id = lesson_favorites.lesson_id 
    AND c.company_id = get_user_company_id()
    AND c.is_active = true
  )
);

CREATE POLICY "Users can favorite lessons they have access to"
ON public.lesson_favorites FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM course_lessons cl
    JOIN course_modules cm ON cm.id = cl.module_id
    JOIN courses c ON c.id = cm.course_id
    WHERE cl.id = lesson_favorites.lesson_id 
    AND c.company_id = get_user_company_id()
    AND c.is_active = true
  )
);

CREATE POLICY "Users can remove their own favorites"
ON public.lesson_favorites FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_lesson_favorites_lesson_id ON public.lesson_favorites(lesson_id);
CREATE INDEX idx_lesson_favorites_user_id ON public.lesson_favorites(user_id);