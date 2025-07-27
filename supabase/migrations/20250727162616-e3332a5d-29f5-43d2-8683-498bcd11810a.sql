-- Create profile for current user in Cae Club company
INSERT INTO public.profiles (user_id, company_id, first_name, last_name, email, role, is_active)
VALUES (
  'e0f86579-0b6c-49f4-a291-5a17c6bbaf36',
  '1e184d5f-db73-4236-a408-1b84b73cbe34',
  'Admin',
  'Cae Club',
  (SELECT email FROM auth.users WHERE id = 'e0f86579-0b6c-49f4-a291-5a17c6bbaf36'),
  'owner',
  true
);