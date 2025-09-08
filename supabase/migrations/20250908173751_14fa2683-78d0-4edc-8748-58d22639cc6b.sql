-- Add requires_submission_review column to challenges table
ALTER TABLE public.challenges 
ADD COLUMN requires_submission_review boolean NOT NULL DEFAULT true;

-- Create function to auto-process challenge submissions
CREATE OR REPLACE FUNCTION public.handle_challenge_submission_processing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  challenge_record RECORD;
  participation_record RECORD;
  existing_reward RECORD;
BEGIN
  -- Only process when status becomes 'approved'
  IF NEW.admin_review_status != 'approved' OR (OLD.admin_review_status IS NOT NULL AND OLD.admin_review_status = 'approved') THEN
    RETURN NEW;
  END IF;

  -- Get challenge details
  SELECT c.*, ucp.id as participation_id, ucp.status as participation_status
  INTO challenge_record
  FROM public.challenges c
  JOIN public.user_challenge_participations ucp ON ucp.challenge_id = c.id
  WHERE c.id = (
    SELECT c2.id 
    FROM public.user_challenge_participations ucp2 
    JOIN public.challenges c2 ON c2.id = ucp2.challenge_id
    WHERE ucp2.id = NEW.participation_id
  )
  AND ucp.id = NEW.participation_id;

  -- Check if participation is already completed (idempotent)
  IF challenge_record.participation_status = 'completed' THEN
    RETURN NEW;
  END IF;

  -- Check if reward was already processed (idempotent)
  SELECT * INTO existing_reward
  FROM public.challenge_rewards
  WHERE challenge_id = challenge_record.id 
  AND user_id = NEW.user_id;

  IF existing_reward.id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Mark participation as completed
  UPDATE public.user_challenge_participations
  SET 
    status = 'completed',
    completed_at = now(),
    updated_at = now()
  WHERE id = NEW.participation_id;

  -- Process reward
  PERFORM public.process_challenge_reward(
    challenge_record.id,
    NEW.user_id,
    NEW.company_id
  );

  -- Create notification
  INSERT INTO public.notifications (
    user_id, company_id, type, title, content, reference_id
  ) VALUES (
    NEW.user_id,
    NEW.company_id,
    'challenge_completed',
    'Desafio Concluído!',
    'Parabéns! Sua submissão para o desafio "' || challenge_record.title || '" foi aprovada e você recebeu sua recompensa.',
    challenge_record.id
  );

  RETURN NEW;
END;
$function$;

-- Create trigger for auto-processing submissions
CREATE TRIGGER handle_challenge_submission_processing_trigger
  AFTER INSERT OR UPDATE ON public.challenge_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_challenge_submission_processing();

-- Create function to auto-approve submissions for challenges that don't require review
CREATE OR REPLACE FUNCTION public.auto_approve_challenge_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  challenge_requires_review boolean;
BEGIN
  -- Only process new submissions
  IF TG_OP != 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Get challenge review requirement
  SELECT c.requires_submission_review INTO challenge_requires_review
  FROM public.challenges c
  JOIN public.user_challenge_participations ucp ON ucp.challenge_id = c.id
  WHERE ucp.id = NEW.participation_id;

  -- If challenge doesn't require review, auto-approve
  IF NOT challenge_requires_review THEN
    NEW.admin_review_status := 'approved';
    NEW.reviewed_at := now();
    NEW.admin_review_notes := 'Aprovado automaticamente';
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger for auto-approval
CREATE TRIGGER auto_approve_challenge_submission_trigger
  BEFORE INSERT ON public.challenge_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_challenge_submission();