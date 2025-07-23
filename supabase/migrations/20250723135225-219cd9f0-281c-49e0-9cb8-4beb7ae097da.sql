-- Add subdomain field to companies table
ALTER TABLE public.companies 
ADD COLUMN subdomain TEXT UNIQUE;

-- Create index for subdomain lookups
CREATE INDEX idx_companies_subdomain ON public.companies(subdomain);

-- Make optional fields nullable if not already
ALTER TABLE public.companies 
ALTER COLUMN cnpj DROP NOT NULL,
ALTER COLUMN phone DROP NOT NULL,
ALTER COLUMN address DROP NOT NULL,
ALTER COLUMN city DROP NOT NULL,
ALTER COLUMN state DROP NOT NULL,
ALTER COLUMN postal_code DROP NOT NULL;