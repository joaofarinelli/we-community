-- Allow public access to companies by custom domain for login page
CREATE POLICY "Public can view companies by custom domain for login" 
ON public.companies 
FOR SELECT 
USING (
  -- Allow access to companies by custom domain (for login page)
  custom_domain IS NOT NULL AND 
  custom_domain_status = 'verified' AND
  status = 'active'
);

-- Also allow access by subdomain for login
CREATE POLICY "Public can view companies by subdomain for login" 
ON public.companies 
FOR SELECT 
USING (
  -- Allow access to companies by subdomain (for login page)
  subdomain IS NOT NULL AND
  status = 'active'
);