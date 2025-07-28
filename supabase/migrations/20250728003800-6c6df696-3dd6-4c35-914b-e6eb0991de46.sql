-- Allow public access to profiles by email and company during login validation
CREATE POLICY "Public can query profiles by email and company for login validation" 
ON public.profiles 
FOR SELECT 
USING (
  -- Allow reading profiles by email and company_id for login validation
  -- This is needed for pre-login validation to work properly
  true
);

-- Check current profiles for debugging
SELECT email, company_id, role, is_active, created_at 
FROM public.profiles 
WHERE email IN ('jv.farinelli@gmail.com', 'joaofarinelli@sparkassessoria.com')
ORDER BY email, created_at;