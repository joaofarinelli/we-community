-- Create trigger to automatically update trail progress
CREATE OR REPLACE FUNCTION public.update_trail_progress_on_stage_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Call the calculate_trail_progress function
  PERFORM public.calculate_trail_progress(NEW.trail_id);
  RETURN NEW;
END;
$function$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_trail_progress ON public.trail_progress;
CREATE TRIGGER trigger_update_trail_progress
AFTER INSERT OR UPDATE ON public.trail_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_trail_progress_on_stage_completion();

-- Update existing trails to have correct progress
DO $$
DECLARE
  trail_record RECORD;
BEGIN
  FOR trail_record IN SELECT DISTINCT id FROM public.trails
  LOOP
    PERFORM public.calculate_trail_progress(trail_record.id);
  END LOOP;
END $$;