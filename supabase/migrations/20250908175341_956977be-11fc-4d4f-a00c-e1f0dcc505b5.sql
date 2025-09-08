-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the expire_challenges function to run every minute
SELECT cron.schedule(
  'expire-challenges-job',
  '* * * * *', -- every minute
  $$
  SELECT public.expire_challenges();
  $$
);

-- Add RLS policy to prevent submissions for expired challenges/participations
CREATE POLICY "Prevent submissions for expired challenges"
ON public.challenge_submissions
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id() 
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1 
    FROM user_challenge_participations ucp
    JOIN challenges c ON c.id = ucp.challenge_id
    WHERE ucp.id = challenge_submissions.participation_id 
    AND ucp.user_id = auth.uid()
    AND ucp.status = 'active'
    AND (ucp.expires_at IS NULL OR ucp.expires_at > now())
    AND (c.end_date IS NULL OR c.end_date > now())
  )
);