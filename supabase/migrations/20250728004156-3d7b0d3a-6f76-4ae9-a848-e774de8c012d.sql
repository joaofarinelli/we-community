-- Recriar o perfil para o user_id que está logado
INSERT INTO public.profiles (user_id, company_id, first_name, last_name, email, role, is_active, created_at)
VALUES (
  'e0f86579-0b6c-49f4-a291-5a17c6bbaf36'::uuid,
  '1e184d5f-db73-4236-a408-1b84b73cbe34'::uuid,
  'João',
  'Farinelli', 
  'jv.farinelli@gmail.com',
  'owner',
  true,
  now()
)
ON CONFLICT (user_id, company_id) DO UPDATE SET 
  is_active = true,
  email = 'jv.farinelli@gmail.com',
  role = 'owner';

-- Verificar se o perfil foi criado corretamente
SELECT user_id, company_id, email, role, is_active, created_at
FROM public.profiles 
WHERE email = 'jv.farinelli@gmail.com'
ORDER BY created_at DESC;