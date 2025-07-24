-- Create enum types for challenges
CREATE TYPE challenge_type AS ENUM (
  'course_completion',
  'post_creation', 
  'marketplace_purchase',
  'custom_action',
  'points_accumulation'
);

CREATE TYPE reward_type AS ENUM (
  'coins',
  'course_access',
  'file_download',
  'marketplace_item'
);

-- Create challenges table
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type challenge_type NOT NULL,
  requirements JSONB NOT NULL DEFAULT '{}',
  reward_type reward_type NOT NULL,
  reward_value JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  max_participants INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenge_progress table
CREATE TABLE public.challenge_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  progress_value INTEGER NOT NULL DEFAULT 0,
  target_value INTEGER NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- Create challenge_rewards table
CREATE TABLE public.challenge_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL,
  reward_details JSONB NOT NULL DEFAULT '{}',
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenge_files table for file rewards
CREATE TABLE public.challenge_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges
CREATE POLICY "Users can view active challenges in their company"
ON public.challenges FOR SELECT
USING (company_id = public.get_user_company_id() AND is_active = true);

CREATE POLICY "Company owners can create challenges"
ON public.challenges FOR INSERT
WITH CHECK (company_id = public.get_user_company_id() AND public.is_company_owner() AND auth.uid() = created_by);

CREATE POLICY "Company owners can update challenges"
ON public.challenges FOR UPDATE
USING (company_id = public.get_user_company_id() AND public.is_company_owner());

CREATE POLICY "Company owners can delete challenges"
ON public.challenges FOR DELETE
USING (company_id = public.get_user_company_id() AND public.is_company_owner());

-- RLS Policies for challenge_progress
CREATE POLICY "Users can view their own progress"
ON public.challenge_progress FOR SELECT
USING (company_id = public.get_user_company_id() AND user_id = auth.uid());

CREATE POLICY "Company owners can view all progress"
ON public.challenge_progress FOR SELECT
USING (company_id = public.get_user_company_id() AND public.is_company_owner());

CREATE POLICY "System can create/update progress"
ON public.challenge_progress FOR INSERT
WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "System can update progress"
ON public.challenge_progress FOR UPDATE
USING (company_id = public.get_user_company_id());

-- RLS Policies for challenge_rewards
CREATE POLICY "Users can view their own rewards"
ON public.challenge_rewards FOR SELECT
USING (company_id = public.get_user_company_id() AND user_id = auth.uid());

CREATE POLICY "Company owners can view all rewards"
ON public.challenge_rewards FOR SELECT
USING (company_id = public.get_user_company_id() AND public.is_company_owner());

CREATE POLICY "System can create rewards"
ON public.challenge_rewards FOR INSERT
WITH CHECK (company_id = public.get_user_company_id());

-- RLS Policies for challenge_files
CREATE POLICY "Users can view files for challenges they have access to"
ON public.challenge_files FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.challenges c
  WHERE c.id = challenge_files.challenge_id 
  AND c.company_id = public.get_user_company_id()
));

CREATE POLICY "Company owners can manage challenge files"
ON public.challenge_files FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.challenges c
  WHERE c.id = challenge_files.challenge_id 
  AND c.company_id = public.get_user_company_id()
  AND public.is_company_owner()
));

-- Create storage bucket for challenge files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('challenge-files', 'challenge-files', false);

-- Storage policies for challenge files
CREATE POLICY "Users can view challenge files they have access to"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'challenge-files' 
  AND EXISTS (
    SELECT 1 FROM public.challenge_rewards cr
    WHERE cr.user_id = auth.uid()
    AND cr.reward_type = 'file_download'
    AND (cr.reward_details->>'file_path') = name
  )
);

CREATE POLICY "Company owners can upload challenge files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'challenge-files'
  AND auth.uid() IS NOT NULL
  AND public.is_company_owner()
);

-- Function to update challenge progress
CREATE OR REPLACE FUNCTION public.update_challenge_progress(
  p_user_id UUID,
  p_company_id UUID,
  p_challenge_type challenge_type,
  p_increment INTEGER DEFAULT 1,
  p_reference_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  challenge_record RECORD;
  progress_record RECORD;
  new_progress INTEGER;
BEGIN
  -- Find active challenges of the specified type
  FOR challenge_record IN 
    SELECT * FROM public.challenges 
    WHERE company_id = p_company_id 
    AND challenge_type = p_challenge_type
    AND is_active = true
    AND (start_date <= now())
    AND (end_date IS NULL OR end_date >= now())
  LOOP
    -- Get or create progress record
    INSERT INTO public.challenge_progress (
      challenge_id, user_id, company_id, progress_value, target_value
    ) VALUES (
      challenge_record.id, 
      p_user_id, 
      p_company_id, 
      0,
      COALESCE((challenge_record.requirements->>'target_value')::INTEGER, 1)
    )
    ON CONFLICT (challenge_id, user_id) 
    DO NOTHING;
    
    -- Update progress
    UPDATE public.challenge_progress 
    SET 
      progress_value = progress_value + p_increment,
      updated_at = now()
    WHERE challenge_id = challenge_record.id 
    AND user_id = p_user_id
    RETURNING progress_value, target_value, is_completed INTO progress_record;
    
    -- Check if challenge is completed
    IF progress_record.progress_value >= progress_record.target_value AND NOT progress_record.is_completed THEN
      -- Mark as completed
      UPDATE public.challenge_progress 
      SET 
        is_completed = true,
        completed_at = now(),
        updated_at = now()
      WHERE challenge_id = challenge_record.id AND user_id = p_user_id;
      
      -- Process reward
      PERFORM public.process_challenge_reward(challenge_record.id, p_user_id, p_company_id);
      
      -- Create notification
      INSERT INTO public.notifications (
        user_id, company_id, type, title, content, reference_id
      ) VALUES (
        p_user_id,
        p_company_id,
        'challenge_completed',
        'Desafio Concluído!',
        'Parabéns! Você concluiu o desafio "' || challenge_record.title || '" e recebeu sua recompensa.',
        challenge_record.id
      );
    END IF;
  END LOOP;
END;
$$;

-- Function to process challenge rewards
CREATE OR REPLACE FUNCTION public.process_challenge_reward(
  p_challenge_id UUID,
  p_user_id UUID,
  p_company_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  challenge_record RECORD;
  reward_amount INTEGER;
BEGIN
  -- Get challenge details
  SELECT * INTO challenge_record 
  FROM public.challenges 
  WHERE id = p_challenge_id;
  
  -- Process reward based on type
  CASE challenge_record.reward_type
    WHEN 'coins' THEN
      reward_amount := (challenge_record.reward_value->>'amount')::INTEGER;
      PERFORM public.add_user_coins(p_user_id, p_company_id, 'challenge_reward', p_challenge_id);
      
      -- Insert coins manually since add_user_coins uses fixed amounts
      INSERT INTO public.point_transactions (user_id, company_id, action_type, points, coins, reference_id)
      VALUES (p_user_id, p_company_id, 'challenge_reward', reward_amount, reward_amount, p_challenge_id);
      
      -- Update total coins
      INSERT INTO public.user_points (user_id, company_id, total_coins)
      VALUES (p_user_id, p_company_id, reward_amount)
      ON CONFLICT (user_id, company_id)
      DO UPDATE SET 
        total_coins = user_points.total_coins + reward_amount,
        updated_at = now();
    
    WHEN 'course_access' THEN
      -- Course access would be handled by application logic
      NULL;
    
    WHEN 'file_download' THEN
      -- File download access would be handled by application logic
      NULL;
    
    WHEN 'marketplace_item' THEN
      -- Marketplace item access would be handled by application logic
      NULL;
  END CASE;
  
  -- Record the reward
  INSERT INTO public.challenge_rewards (
    challenge_id, user_id, company_id, reward_type, reward_details
  ) VALUES (
    p_challenge_id, p_user_id, p_company_id, 
    challenge_record.reward_type::TEXT, challenge_record.reward_value
  );
END;
$$;

-- Triggers to update challenge progress automatically
CREATE OR REPLACE FUNCTION public.handle_post_challenge_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.update_challenge_progress(
    NEW.author_id, 
    NEW.company_id, 
    'post_creation'::challenge_type
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_post_challenge_progress
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_post_challenge_progress();

-- Trigger for marketplace purchases
CREATE OR REPLACE FUNCTION public.handle_purchase_challenge_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.update_challenge_progress(
    NEW.user_id, 
    NEW.company_id, 
    'marketplace_purchase'::challenge_type
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_purchase_challenge_progress
  AFTER INSERT ON public.marketplace_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_purchase_challenge_progress();

-- Trigger for course completion
CREATE OR REPLACE FUNCTION public.handle_course_challenge_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.update_challenge_progress(
    NEW.user_id, 
    (SELECT c.company_id FROM courses c 
     JOIN course_modules cm ON cm.course_id = c.id 
     JOIN course_lessons cl ON cl.module_id = cm.id 
     WHERE cl.id = NEW.lesson_id), 
    'course_completion'::challenge_type
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_course_challenge_progress
  AFTER INSERT ON public.user_course_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_course_challenge_progress();

-- Update triggers for timestamps
CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_challenge_progress_updated_at
  BEFORE UPDATE ON public.challenge_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();