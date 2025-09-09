-- Add performance indexes for quiz reviews
CREATE INDEX IF NOT EXISTS idx_lesson_quiz_answers_review_performance 
ON public.lesson_quiz_answers(review_status, created_at DESC) 
WHERE text_answer IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lesson_quiz_attempts_company_user 
ON public.lesson_quiz_attempts(company_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lesson_quiz_answers_attempt_question 
ON public.lesson_quiz_answers(attempt_id, question_id);

CREATE INDEX IF NOT EXISTS idx_lesson_quizzes_lesson_id 
ON public.lesson_quizzes(lesson_id, is_active) 
WHERE is_active = true;

-- Add composite index for faster joins
CREATE INDEX IF NOT EXISTS idx_quiz_answers_full_review 
ON public.lesson_quiz_answers(attempt_id, review_status, created_at DESC, text_answer) 
WHERE text_answer IS NOT NULL;