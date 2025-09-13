-- Add pinning fields to challenges table
ALTER TABLE public.challenges 
ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN pinned_order INTEGER DEFAULT NULL;

-- Create index for better performance when querying pinned challenges
CREATE INDEX idx_challenges_pinned ON public.challenges(company_id, is_pinned, pinned_order) WHERE is_pinned = true;