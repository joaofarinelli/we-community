-- Prevent users from joining the same trail more than once
-- Add unique constraint to ensure one user can only have one trail per template/trail combination

-- First, let's add a unique constraint to prevent duplicate trail assignments
-- This will prevent a user from having multiple instances of the same trail

ALTER TABLE public.trails 
ADD CONSTRAINT unique_user_trail_template 
UNIQUE (user_id, template_id, company_id);

-- Also add a partial unique constraint for trails without templates
-- This ensures a user can't have multiple instances of the same custom trail
CREATE UNIQUE INDEX unique_user_custom_trail 
ON public.trails (user_id, name, company_id) 
WHERE template_id IS NULL;