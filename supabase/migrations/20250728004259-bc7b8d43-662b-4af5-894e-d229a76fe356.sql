-- Adicionar o usuário logado aos espaços públicos da empresa
INSERT INTO public.space_members (space_id, user_id, role, joined_at)
SELECT s.id, 'e0f86579-0b6c-49f4-a291-5a17c6bbaf36'::uuid, 'member', now()
FROM public.spaces s
WHERE s.company_id = '1e184d5f-db73-4236-a408-1b84b73cbe34'::uuid
  AND s.visibility = 'public'
  AND NOT EXISTS (
    SELECT 1 FROM public.space_members sm 
    WHERE sm.space_id = s.id 
      AND sm.user_id = 'e0f86579-0b6c-49f4-a291-5a17c6bbaf36'::uuid
  );

-- Verificar os memberships criados
SELECT sm.space_id, s.name as space_name, sm.user_id, sm.role
FROM public.space_members sm
JOIN public.spaces s ON s.id = sm.space_id
WHERE sm.user_id = 'e0f86579-0b6c-49f4-a291-5a17c6bbaf36'::uuid;