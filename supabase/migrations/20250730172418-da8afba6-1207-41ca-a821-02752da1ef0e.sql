-- Add enabled_features column to companies table
ALTER TABLE public.companies 
ADD COLUMN enabled_features jsonb DEFAULT '{"marketplace": true, "ranking": true, "bank": true, "store": true, "streak": true, "challenges": true}'::jsonb;

-- Create index for better performance on feature queries
CREATE INDEX idx_companies_enabled_features ON public.companies USING GIN (enabled_features);

-- Update existing companies to have all features enabled by default
UPDATE public.companies 
SET enabled_features = '{"marketplace": true, "ranking": true, "bank": true, "store": true, "streak": true, "challenges": true}'::jsonb 
WHERE enabled_features IS NULL;