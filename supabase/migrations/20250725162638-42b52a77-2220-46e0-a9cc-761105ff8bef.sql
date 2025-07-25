-- Add custom domain fields to companies table
ALTER TABLE public.companies 
ADD COLUMN custom_domain text,
ADD COLUMN custom_domain_status text DEFAULT NULL,
ADD COLUMN custom_domain_verified_at timestamp with time zone DEFAULT NULL;

-- Add constraint for custom_domain_status values
ALTER TABLE public.companies 
ADD CONSTRAINT companies_custom_domain_status_check 
CHECK (custom_domain_status IS NULL OR custom_domain_status IN ('pending', 'verified', 'failed'));

-- Create index for efficient custom domain lookups
CREATE INDEX idx_companies_custom_domain ON public.companies(custom_domain) WHERE custom_domain IS NOT NULL;

-- Update RLS policy to allow custom domain lookups
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
CREATE POLICY "Users can view their own company" ON public.companies
FOR SELECT USING (
  id = get_user_company_id() OR 
  subdomain = split_part(current_setting('request.headers')::json->>'host', '.', 1) OR
  custom_domain = current_setting('request.headers')::json->>'host'
);