-- First, identify and clean up duplicate trails before adding the constraint
-- Keep only the most recent trail for each user-template combination

-- Delete duplicate trails, keeping only the most recent one for each user-template combination
WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, template_id, company_id 
      ORDER BY created_at DESC
    ) as rn
  FROM public.trails
  WHERE template_id IS NOT NULL
)
DELETE FROM public.trails 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Delete duplicate custom trails (without template), keeping the most recent
WITH custom_duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, name, company_id 
      ORDER BY created_at DESC
    ) as rn
  FROM public.trails
  WHERE template_id IS NULL
)
DELETE FROM public.trails 
WHERE id IN (
  SELECT id FROM custom_duplicates WHERE rn > 1
);

-- Now add the unique constraints
ALTER TABLE public.trails 
ADD CONSTRAINT unique_user_trail_template 
UNIQUE (user_id, template_id, company_id);

-- Add partial unique constraint for custom trails
CREATE UNIQUE INDEX unique_user_custom_trail 
ON public.trails (user_id, name, company_id) 
WHERE template_id IS NULL;