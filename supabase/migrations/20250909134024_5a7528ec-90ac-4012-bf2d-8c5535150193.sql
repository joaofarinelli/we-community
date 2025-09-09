-- Add review status to lesson_quiz_answers for text questions
ALTER TABLE public.lesson_quiz_answers 
ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected'));

-- Add review notes for admin feedback
ALTER TABLE public.lesson_quiz_answers 
ADD COLUMN IF NOT EXISTS review_notes text;

-- Add reviewed_by to track who reviewed the answer
ALTER TABLE public.lesson_quiz_answers 
ADD COLUMN IF NOT EXISTS reviewed_by uuid;

-- Add reviewed_at timestamp
ALTER TABLE public.lesson_quiz_answers 
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone;

-- Create index for efficient queries on review status
CREATE INDEX IF NOT EXISTS idx_lesson_quiz_answers_review_status 
ON public.lesson_quiz_answers(review_status) 
WHERE review_status = 'pending';