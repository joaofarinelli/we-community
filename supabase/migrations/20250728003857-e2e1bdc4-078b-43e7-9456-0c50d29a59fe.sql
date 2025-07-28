-- Remove the older duplicate profile for jv.farinelli@gmail.com
-- Keep the most recent one (2025-07-27) and delete the older one (2025-07-24)
DELETE FROM public.profiles 
WHERE email = 'jv.farinelli@gmail.com' 
  AND company_id = '1e184d5f-db73-4236-a408-1b84b73cbe34'
  AND created_at = '2025-07-24 00:09:56.615128+00';

-- Verify there's only one profile left
SELECT email, company_id, role, is_active, created_at 
FROM public.profiles 
WHERE email = 'jv.farinelli@gmail.com'
ORDER BY created_at;