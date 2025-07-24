-- Add difficulty level to course_lessons table
ALTER TABLE public.course_lessons 
ADD COLUMN difficulty_level TEXT DEFAULT 'beginner';

-- Add check constraint for difficulty levels
ALTER TABLE public.course_lessons 
ADD CONSTRAINT check_difficulty_level 
CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced'));

-- Create lesson_comments table
CREATE TABLE public.lesson_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_comment_id UUID REFERENCES public.lesson_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on lesson_comments
ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for lesson_comments
CREATE POLICY "Users can view comments on lessons they have access to"
ON public.lesson_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM course_lessons cl
    JOIN course_modules cm ON cm.id = cl.module_id
    JOIN courses c ON c.id = cm.course_id
    WHERE cl.id = lesson_comments.lesson_id 
    AND c.company_id = get_user_company_id()
    AND c.is_active = true
  )
);

CREATE POLICY "Users can create comments on lessons they have access to"
ON public.lesson_comments FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM course_lessons cl
    JOIN course_modules cm ON cm.id = cl.module_id
    JOIN courses c ON c.id = cm.course_id
    WHERE cl.id = lesson_comments.lesson_id 
    AND c.company_id = get_user_company_id()
    AND c.is_active = true
  )
);

CREATE POLICY "Users can update their own comments"
ON public.lesson_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.lesson_comments FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_lesson_comments_lesson_id ON public.lesson_comments(lesson_id);
CREATE INDEX idx_lesson_comments_parent_comment_id ON public.lesson_comments(parent_comment_id);
CREATE INDEX idx_lesson_comments_user_id ON public.lesson_comments(user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lesson_comments_updated_at
BEFORE UPDATE ON public.lesson_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();