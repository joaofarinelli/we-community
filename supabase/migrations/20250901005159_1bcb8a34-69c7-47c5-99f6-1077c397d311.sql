-- Update RLS policies for challenge submissions to support admin approval workflow

-- Drop existing policies and recreate with proper admin approval logic
DROP POLICY IF EXISTS "Company owners can review submissions" ON public.challenge_submissions;
DROP POLICY IF EXISTS "Company owners can view all submissions" ON public.challenge_submissions;
DROP POLICY IF EXISTS "Users can submit their own submissions" ON public.challenge_submissions;
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.challenge_submissions;

-- Policy for users to create their own submissions (only when participating in challenge)
CREATE POLICY "Users can create submissions for their participations"
ON public.challenge_submissions
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id() AND
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.user_challenge_participations ucp
    WHERE ucp.id = challenge_submissions.participation_id
    AND ucp.user_id = auth.uid()
    AND ucp.status = 'active'
  )
);

-- Policy for users to view their own submissions
CREATE POLICY "Users can view their own submissions"
ON public.challenge_submissions
FOR SELECT
USING (company_id = get_user_company_id() AND user_id = auth.uid());

-- Policy for admins to view all submissions in their company
CREATE POLICY "Company owners and admins can view all submissions"
ON public.challenge_submissions
FOR SELECT
USING (
  company_id = get_user_company_id() AND 
  (is_company_owner() OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.company_id = challenge_submissions.company_id
    AND p.role IN ('owner', 'admin')
    AND p.is_active = true
  ))
);

-- Policy for admins to update submission reviews
CREATE POLICY "Company owners and admins can review submissions"
ON public.challenge_submissions
FOR UPDATE
USING (
  company_id = get_user_company_id() AND 
  (is_company_owner() OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.company_id = challenge_submissions.company_id
    AND p.role IN ('owner', 'admin')
    AND p.is_active = true
  ))
);

-- Create function to handle submission approval and trigger rewards
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for submission approval
DROP TRIGGER IF EXISTS challenge_submission_approval_trigger ON public.challenge_submissions;
CREATE TRIGGER challenge_submission_approval_trigger
  AFTER UPDATE ON public.challenge_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_challenge_submission_approval();

-- Update challenge_type enum to include proof_based type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'challenge_type' AND e.enumlabel = 'proof_based') THEN
    ALTER TYPE challenge_type ADD VALUE 'proof_based';
  END IF;
END
$$;