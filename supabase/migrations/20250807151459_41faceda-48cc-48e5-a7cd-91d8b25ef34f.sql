-- Add deadline_type and challenge_duration_hours to challenges
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS deadline_type text NOT NULL DEFAULT 'duration',
  ADD COLUMN IF NOT EXISTS challenge_duration_hours integer NOT NULL DEFAULT 0;

-- Backfill deadline_type based on existing data
UPDATE public.challenges
SET deadline_type = CASE
  WHEN end_date IS NOT NULL THEN 'fixed_date'
  ELSE 'duration'
END
WHERE deadline_type IS NULL OR deadline_type = '';

-- Note: We intentionally avoid time-based CHECK constraints and rely on app-level validation
-- to ensure end_date is in the future and durations are positive, per best practices.