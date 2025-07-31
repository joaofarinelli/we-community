-- Add video and response fields to trail_stages
ALTER TABLE public.trail_stages 
ADD COLUMN video_url TEXT,
ADD COLUMN question TEXT,
ADD COLUMN requires_response BOOLEAN NOT NULL DEFAULT false;

-- Create table for user responses to trail stages
CREATE TABLE public.trail_stage_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trail_id UUID NOT NULL,
  stage_id UUID NOT NULL,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  response_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trail_id, stage_id, user_id)
);

-- Enable RLS on trail_stage_responses
ALTER TABLE public.trail_stage_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for trail_stage_responses
CREATE POLICY "Users can create their own responses" 
ON public.trail_stage_responses 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() 
  AND company_id = get_user_company_id()
  AND EXISTS (
    SELECT 1 FROM public.trails t 
    WHERE t.id = trail_stage_responses.trail_id 
    AND t.company_id = get_user_company_id()
  )
);

CREATE POLICY "Users can view their own responses" 
ON public.trail_stage_responses 
FOR SELECT 
USING (
  user_id = auth.uid() 
  AND company_id = get_user_company_id()
);

CREATE POLICY "Users can update their own responses" 
ON public.trail_stage_responses 
FOR UPDATE 
USING (
  user_id = auth.uid() 
  AND company_id = get_user_company_id()
);

CREATE POLICY "Company owners can view all responses" 
ON public.trail_stage_responses 
FOR SELECT 
USING (
  company_id = get_user_company_id() 
  AND is_company_owner()
);

-- Add trigger for updated_at
CREATE TRIGGER update_trail_stage_responses_updated_at
BEFORE UPDATE ON public.trail_stage_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update calculate_trail_progress function to consider responses
CREATE OR REPLACE FUNCTION public.calculate_trail_progress(p_trail_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  total_stages INTEGER;
  completed_stages INTEGER;
  progress_percentage INTEGER;
BEGIN
  -- Count total stages
  SELECT COUNT(*) INTO total_stages
  FROM public.trail_stages
  WHERE trail_id = p_trail_id;
  
  -- Count completed stages (those that are marked as completed in trail_progress)
  SELECT COUNT(*) INTO completed_stages
  FROM public.trail_progress tp
  WHERE tp.trail_id = p_trail_id 
  AND tp.is_completed = true;
  
  -- Calculate percentage
  IF total_stages > 0 THEN
    progress_percentage := ROUND((completed_stages::DECIMAL / total_stages::DECIMAL) * 100);
  ELSE
    progress_percentage := 0;
  END IF;
  
  -- Update trail progress
  UPDATE public.trails 
  SET progress_percentage = progress_percentage,
      updated_at = now()
  WHERE id = p_trail_id;
  
  RETURN progress_percentage;
END;
$function$;