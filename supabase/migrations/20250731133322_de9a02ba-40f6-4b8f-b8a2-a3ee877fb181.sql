-- Fix the calculate_trail_progress function to avoid column ambiguity
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
  FROM public.trail_stages ts
  WHERE ts.trail_id = p_trail_id;
  
  -- Count completed stages
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