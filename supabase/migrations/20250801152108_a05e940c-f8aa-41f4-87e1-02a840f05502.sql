-- Add duration field to challenges table
ALTER TABLE public.challenges 
ADD COLUMN challenge_duration_days integer DEFAULT 7;

-- Create user challenge participations table
CREATE TABLE public.user_challenge_participations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id uuid NOT NULL,
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  accepted_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'abandoned')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- Create challenge submissions table
CREATE TABLE public.challenge_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  submission_type text NOT NULL CHECK (submission_type IN ('text', 'image', 'file')),
  submission_content text,
  file_url text,
  file_name text,
  file_size integer,
  mime_type text,
  admin_review_status text DEFAULT 'pending' CHECK (admin_review_status IN ('pending', 'approved', 'rejected')),
  admin_review_notes text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.user_challenge_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_challenge_participations
CREATE POLICY "Users can participate in challenges in their company"
ON public.user_challenge_participations
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id() 
  AND user_id = auth.uid()
);

CREATE POLICY "Users can view their own participations"
ON public.user_challenge_participations
FOR SELECT
USING (
  company_id = get_user_company_id() 
  AND user_id = auth.uid()
);

CREATE POLICY "Company owners can view all participations"
ON public.user_challenge_participations
FOR SELECT
USING (
  company_id = get_user_company_id() 
  AND is_company_owner()
);

CREATE POLICY "Users can update their own participations"
ON public.user_challenge_participations
FOR UPDATE
USING (
  company_id = get_user_company_id() 
  AND user_id = auth.uid()
);

-- RLS policies for challenge_submissions
CREATE POLICY "Users can submit their own submissions"
ON public.challenge_submissions
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id() 
  AND user_id = auth.uid()
);

CREATE POLICY "Users can view their own submissions"
ON public.challenge_submissions
FOR SELECT
USING (
  company_id = get_user_company_id() 
  AND user_id = auth.uid()
);

CREATE POLICY "Company owners can view all submissions"
ON public.challenge_submissions
FOR SELECT
USING (
  company_id = get_user_company_id() 
  AND is_company_owner()
);

CREATE POLICY "Company owners can review submissions"
ON public.challenge_submissions
FOR UPDATE
USING (
  company_id = get_user_company_id() 
  AND is_company_owner()
);

-- Add triggers for updated_at
CREATE TRIGGER update_user_challenge_participations_updated_at
  BEFORE UPDATE ON public.user_challenge_participations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_challenge_submissions_updated_at
  BEFORE UPDATE ON public.challenge_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically expire challenges
CREATE OR REPLACE FUNCTION public.expire_challenges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_challenge_participations
  SET 
    status = 'expired',
    updated_at = now()
  WHERE expires_at < now() 
    AND status = 'active';
END;
$$;

-- Add custom_goal challenge type to enum (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'challenge_type' AND typcategory = 'E') THEN
    CREATE TYPE challenge_type AS ENUM ('course_completion', 'post_creation', 'marketplace_purchase', 'custom_action', 'points_accumulation', 'custom_goal');
  ELSE
    -- Add new value to existing enum
    ALTER TYPE challenge_type ADD VALUE IF NOT EXISTS 'custom_goal';
  END IF;
END$$;