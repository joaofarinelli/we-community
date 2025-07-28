-- First, let's see what references exist for both user_ids
WITH duplicate_profiles AS (
  SELECT user_id, email, created_at, role
  FROM public.profiles 
  WHERE email = 'jv.farinelli@gmail.com' 
    AND company_id = '1e184d5f-db73-4236-a408-1b84b73cbe34'
  ORDER BY created_at
)
SELECT 
  dp.user_id,
  dp.created_at,
  dp.role,
  (SELECT COUNT(*) FROM space_members WHERE user_id = dp.user_id) as space_member_count,
  (SELECT COUNT(*) FROM posts WHERE author_id = dp.user_id) as posts_count,
  (SELECT COUNT(*) FROM user_points WHERE user_id = dp.user_id) as points_count
FROM duplicate_profiles dp;