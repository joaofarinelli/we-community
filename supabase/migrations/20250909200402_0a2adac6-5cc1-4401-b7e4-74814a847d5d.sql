-- Create table for lesson quiz question attempts (essay questions)
CREATE TABLE public.lesson_quiz_question_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL,
  text_answer TEXT,
  review_status TEXT NOT NULL DEFAULT 'pending',
  review_notes TEXT,
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  company_id UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.lesson_quiz_question_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own attempts" 
ON public.lesson_quiz_question_attempts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND company_id = get_user_company_id());

CREATE POLICY "Users can view their own attempts" 
ON public.lesson_quiz_question_attempts 
FOR SELECT 
USING (auth.uid() = user_id AND company_id = get_user_company_id());

CREATE POLICY "Company owners and admins can view all attempts" 
ON public.lesson_quiz_question_attempts 
FOR SELECT 
USING (
  company_id = get_user_company_id() AND 
  (is_company_owner() OR EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.company_id = lesson_quiz_question_attempts.company_id 
    AND p.role IN ('owner', 'admin') 
    AND p.is_active = true
  ))
);

CREATE POLICY "Company owners and admins can update attempts for review" 
ON public.lesson_quiz_question_attempts 
FOR UPDATE 
USING (
  company_id = get_user_company_id() AND 
  (is_company_owner() OR EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.company_id = lesson_quiz_question_attempts.company_id 
    AND p.role IN ('owner', 'admin') 
    AND p.is_active = true
  ))
);

-- Create function to review essay answers
CREATE OR REPLACE FUNCTION public.review_essay_answer(
  p_answer_id UUID,
  p_review_status TEXT,
  p_review_notes TEXT DEFAULT NULL,
  p_points_earned INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Update the attempt with review details
  UPDATE public.lesson_quiz_question_attempts 
  SET 
    review_status = p_review_status,
    review_notes = p_review_notes,
    points_earned = p_points_earned,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  WHERE id = p_answer_id
  RETURNING to_json(lesson_quiz_question_attempts.*) INTO result;
  
  IF result IS NULL THEN
    RAISE EXCEPTION 'Answer not found or access denied';
  END IF;
  
  RETURN result;
END;
$$;

-- Create trigger for updating updated_at
CREATE TRIGGER update_lesson_quiz_question_attempts_updated_at
  BEFORE UPDATE ON public.lesson_quiz_question_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();