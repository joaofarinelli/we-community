-- Check current email for Cae Club user
SELECT p.email, p.user_id, c.name as company_name
FROM public.profiles p
JOIN public.companies c ON c.id = p.company_id
WHERE c.name = 'Cae Club';