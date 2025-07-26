-- Create profile for Cae Club using the current user_id
INSERT INTO public.profiles (
  user_id, 
  company_id, 
  first_name, 
  last_name, 
  email, 
  role,
  is_active
) VALUES (
  'e0f86579-0b6c-49f4-a291-5a17c6bbaf36'::uuid,
  (SELECT id FROM public.companies WHERE name = 'Cae Club' LIMIT 1),
  'João',
  'Farinelli',
  'jv.farinelli@gmail.com',
  'member',
  true
)
ON CONFLICT (user_id, company_id) DO NOTHING;