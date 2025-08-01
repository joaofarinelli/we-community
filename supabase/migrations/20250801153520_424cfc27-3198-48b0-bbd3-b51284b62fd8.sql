-- Add access_tags field to challenges table for tag-based access control
ALTER TABLE public.challenges 
ADD COLUMN access_tags text[] DEFAULT '{}';

-- Add comment to explain the field
COMMENT ON COLUMN public.challenges.access_tags IS 'Array of tags that restrict challenge access. Empty array means accessible to all users.';

-- Create index for better performance on tag queries
CREATE INDEX idx_challenges_access_tags ON public.challenges USING GIN(access_tags);

-- Update existing challenges to have empty access_tags (accessible to all)
UPDATE public.challenges SET access_tags = '{}' WHERE access_tags IS NULL;