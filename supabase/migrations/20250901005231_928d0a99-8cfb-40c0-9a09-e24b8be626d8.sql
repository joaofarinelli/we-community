-- Fix security issues by setting proper search_path for functions

-- Fix the handle_challenge_submission_approval function
CREATE OR REPLACE FUNCTION public.handle_challenge_submission_approval()
RETURNS TRIGGER AS $$
DECLARE
  participation_record RECORD;
  challenge_record RECORD;
BEGIN
  -- Only process when status changes to 'approved'
  IF NEW.admin_review_status = 'approved' AND OLD.admin_review_status != 'approved' THEN
    -- Get participation details
    SELECT * INTO participation_record
    FROM public.user_challenge_participations
    WHERE id = NEW.participation_id;
    
    -- Get challenge details
    SELECT * INTO challenge_record
    FROM public.challenges
    WHERE id = participation_record.challenge_id;
    
    -- Complete the participation
    UPDATE public.user_challenge_participations
    SET status = 'completed', completed_at = now()
    WHERE id = NEW.participation_id;
    
    -- Mark challenge progress as completed
    UPDATE public.challenge_progress
    SET is_completed = true, completed_at = now()
    WHERE challenge_id = participation_record.challenge_id
    AND user_id = participation_record.user_id;
    
    -- Process challenge reward
    PERFORM public.process_challenge_reward(
      challenge_record.id, 
      participation_record.user_id, 
      participation_record.company_id
    );
    
    -- Create notification for user
    INSERT INTO public.notifications (
      user_id, company_id, type, title, content, reference_id
    ) VALUES (
      participation_record.user_id,
      participation_record.company_id,
      'challenge_approved',
      'Desafio Aprovado! 🎉',
      'Sua submissão para o desafio "' || challenge_record.title || '" foi aprovada e você recebeu sua recompensa!',
      challenge_record.id
    );
    
  ELSIF NEW.admin_review_status = 'rejected' AND OLD.admin_review_status != 'rejected' THEN
    -- Get participation details for notification
    SELECT ucp.*, c.title as challenge_title INTO participation_record
    FROM public.user_challenge_participations ucp
    JOIN public.challenges c ON c.id = ucp.challenge_id
    WHERE ucp.id = NEW.participation_id;
    
    -- Create notification for rejected submission
    INSERT INTO public.notifications (
      user_id, company_id, type, title, content, reference_id
    ) VALUES (
      participation_record.user_id,
      participation_record.company_id,
      'challenge_rejected',
      'Submissão Rejeitada',
      'Sua submissão para o desafio "' || participation_record.challenge_title || '" foi rejeitada. ' ||
      CASE WHEN NEW.admin_review_notes IS NOT NULL 
           THEN 'Motivo: ' || NEW.admin_review_notes
           ELSE 'Verifique os requisitos e tente novamente.'
      END,
      participation_record.challenge_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;