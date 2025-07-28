-- Instead of deleting, let's merge the newer profile data into the older one
-- and then remove the newer duplicate

-- Transfer space memberships from newer to older user_id (if not already exists)
INSERT INTO space_members (space_id, user_id, role, joined_at)
SELECT DISTINCT sm.space_id, '8beb8843-aeb0-4afd-a6b5-2bd90c2a1731', sm.role, sm.joined_at
FROM space_members sm
WHERE sm.user_id = 'e0f86579-0b6c-49f4-a291-5a17c6bbaf36'
  AND NOT EXISTS (
    SELECT 1 FROM space_members sm2 
    WHERE sm2.space_id = sm.space_id 
      AND sm2.user_id = '8beb8843-aeb0-4afd-a6b5-2bd90c2a1731'
  );

-- Remove space memberships for the newer user_id
DELETE FROM space_members WHERE user_id = 'e0f86579-0b6c-49f4-a291-5a17c6bbaf36';

-- Remove the newer duplicate profile
DELETE FROM public.profiles 
WHERE user_id = 'e0f86579-0b6c-49f4-a291-5a17c6bbaf36' 
  AND email = 'jv.farinelli@gmail.com' 
  AND company_id = '1e184d5f-db73-4236-a408-1b84b73cbe34';

-- Verify cleanup
SELECT email, user_id, company_id, role, is_active, created_at 
FROM public.profiles 
WHERE email = 'jv.farinelli@gmail.com'
ORDER BY created_at;