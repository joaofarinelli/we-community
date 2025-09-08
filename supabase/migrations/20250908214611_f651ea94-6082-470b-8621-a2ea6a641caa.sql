-- Create lesson_quizzes table
CREATE TABLE public.lesson_quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70,
  max_attempts INTEGER DEFAULT 3,
  time_limit_minutes INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lesson_quiz_questions table
CREATE TABLE public.lesson_quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'text')),
  order_index INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 1,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lesson_quiz_options table (for multiple choice and true/false questions)
CREATE TABLE public.lesson_quiz_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lesson_quiz_attempts table
CREATE TABLE public.lesson_quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  score INTEGER,
  max_score INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'pending_review')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  attempt_number INTEGER NOT NULL DEFAULT 1
);

-- Create lesson_quiz_answers table
CREATE TABLE public.lesson_quiz_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL,
  question_id UUID NOT NULL,
  selected_option_id UUID,
  text_answer TEXT,
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.lesson_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_quiz_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_quizzes
CREATE POLICY "Company owners can manage lesson quizzes"
ON public.lesson_quizzes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM course_lessons cl
    JOIN course_modules cm ON cm.id = cl.module_id
    JOIN courses c ON c.id = cm.course_id
    WHERE cl.id = lesson_quizzes.lesson_id
    AND c.company_id = get_user_company_id()
    AND is_company_owner()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM course_lessons cl
    JOIN course_modules cm ON cm.id = cl.module_id
    JOIN courses c ON c.id = cm.course_id
    WHERE cl.id = lesson_quizzes.lesson_id
    AND c.company_id = get_user_company_id()
    AND is_company_owner()
    AND auth.uid() = created_by
  )
);

CREATE POLICY "Users can view active lesson quizzes"
ON public.lesson_quizzes FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM course_lessons cl
    JOIN course_modules cm ON cm.id = cl.module_id
    JOIN courses c ON c.id = cm.course_id
    WHERE cl.id = lesson_quizzes.lesson_id
    AND c.company_id = get_user_company_id()
    AND user_has_course_access(auth.uid(), c.id)
  )
);

-- RLS Policies for lesson_quiz_questions
CREATE POLICY "Company owners can manage quiz questions"
ON public.lesson_quiz_questions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM lesson_quizzes lq
    JOIN course_lessons cl ON cl.id = lq.lesson_id
    JOIN course_modules cm ON cm.id = cl.module_id
    JOIN courses c ON c.id = cm.course_id
    WHERE lq.id = lesson_quiz_questions.quiz_id
    AND c.company_id = get_user_company_id()
    AND is_company_owner()
  )
);

CREATE POLICY "Users can view questions of accessible quizzes"
ON public.lesson_quiz_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM lesson_quizzes lq
    JOIN course_lessons cl ON cl.id = lq.lesson_id
    JOIN course_modules cm ON cm.id = cl.module_id
    JOIN courses c ON c.id = cm.course_id
    WHERE lq.id = lesson_quiz_questions.quiz_id
    AND c.company_id = get_user_company_id()
    AND user_has_course_access(auth.uid(), c.id)
    AND lq.is_active = true
  )
);

-- RLS Policies for lesson_quiz_options
CREATE POLICY "Company owners can manage quiz options"
ON public.lesson_quiz_options FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM lesson_quiz_questions lqq
    JOIN lesson_quizzes lq ON lq.id = lqq.quiz_id
    JOIN course_lessons cl ON cl.id = lq.lesson_id
    JOIN course_modules cm ON cm.id = cl.module_id
    JOIN courses c ON c.id = cm.course_id
    WHERE lqq.id = lesson_quiz_options.question_id
    AND c.company_id = get_user_company_id()
    AND is_company_owner()
  )
);

CREATE POLICY "Users can view options of accessible questions"
ON public.lesson_quiz_options FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM lesson_quiz_questions lqq
    JOIN lesson_quizzes lq ON lq.id = lqq.quiz_id
    JOIN course_lessons cl ON cl.id = lq.lesson_id
    JOIN course_modules cm ON cm.id = cl.module_id
    JOIN courses c ON c.id = cm.course_id
    WHERE lqq.id = lesson_quiz_options.question_id
    AND c.company_id = get_user_company_id()
    AND user_has_course_access(auth.uid(), c.id)
    AND lq.is_active = true
  )
);

-- RLS Policies for lesson_quiz_attempts
CREATE POLICY "Company owners can view all quiz attempts"
ON public.lesson_quiz_attempts FOR SELECT
USING (company_id = get_user_company_id() AND is_company_owner());

CREATE POLICY "Company owners can update attempts for review"
ON public.lesson_quiz_attempts FOR UPDATE
USING (company_id = get_user_company_id() AND is_company_owner());

CREATE POLICY "Users can create their own quiz attempts"
ON public.lesson_quiz_attempts FOR INSERT
WITH CHECK (
  company_id = get_user_company_id()
  AND user_id = auth.uid()
);

CREATE POLICY "Users can view their own quiz attempts"
ON public.lesson_quiz_attempts FOR SELECT
USING (
  company_id = get_user_company_id()
  AND user_id = auth.uid()
);

CREATE POLICY "System can update quiz attempts"
ON public.lesson_quiz_attempts FOR UPDATE
USING (company_id = get_user_company_id());

-- RLS Policies for lesson_quiz_answers
CREATE POLICY "Company owners can view all quiz answers"
ON public.lesson_quiz_answers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM lesson_quiz_attempts lqa
    WHERE lqa.id = lesson_quiz_answers.attempt_id
    AND lqa.company_id = get_user_company_id()
    AND is_company_owner()
  )
);

CREATE POLICY "Company owners can update answers for review"
ON public.lesson_quiz_answers FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM lesson_quiz_attempts lqa
    WHERE lqa.id = lesson_quiz_answers.attempt_id
    AND lqa.company_id = get_user_company_id()
    AND is_company_owner()
  )
);

CREATE POLICY "Users can create their own quiz answers"
ON public.lesson_quiz_answers FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM lesson_quiz_attempts lqa
    WHERE lqa.id = lesson_quiz_answers.attempt_id
    AND lqa.user_id = auth.uid()
    AND lqa.company_id = get_user_company_id()
  )
);

CREATE POLICY "Users can view their own quiz answers"
ON public.lesson_quiz_answers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM lesson_quiz_attempts lqa
    WHERE lqa.id = lesson_quiz_answers.attempt_id
    AND lqa.user_id = auth.uid()
    AND lqa.company_id = get_user_company_id()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_lesson_quizzes_lesson_id ON public.lesson_quizzes(lesson_id);
CREATE INDEX idx_quiz_questions_quiz_id ON public.lesson_quiz_questions(quiz_id);
CREATE INDEX idx_quiz_options_question_id ON public.lesson_quiz_options(question_id);
CREATE INDEX idx_quiz_attempts_quiz_user ON public.lesson_quiz_attempts(quiz_id, user_id);
CREATE INDEX idx_quiz_answers_attempt_id ON public.lesson_quiz_answers(attempt_id);

-- Add trigger for updated_at
CREATE TRIGGER update_lesson_quizzes_updated_at
  BEFORE UPDATE ON public.lesson_quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lesson_quiz_questions_updated_at
  BEFORE UPDATE ON public.lesson_quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();