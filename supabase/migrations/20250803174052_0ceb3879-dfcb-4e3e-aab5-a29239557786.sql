-- Step 1: Drop all foreign key constraints that depend on profiles.user_id
ALTER TABLE public.space_members DROP CONSTRAINT IF EXISTS space_members_user_id_fkey;
ALTER TABLE public.user_points DROP CONSTRAINT IF EXISTS user_points_user_id_fkey;
ALTER TABLE public.point_transactions DROP CONSTRAINT IF EXISTS point_transactions_user_id_fkey;
ALTER TABLE public.user_levels DROP CONSTRAINT IF EXISTS user_levels_created_by_fkey;
ALTER TABLE public.user_current_level DROP CONSTRAINT IF EXISTS user_current_level_user_id_fkey;
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey;
ALTER TABLE public.post_interactions DROP CONSTRAINT IF EXISTS post_interactions_user_id_fkey;

-- Step 2: Drop the unique constraint on user_id
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_key;

-- Step 3: Add unique constraint on (user_id, company_id) combination
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_company_id_key 
UNIQUE (user_id, company_id);

-- Step 4: Recreate foreign key constraints to reference the composite key or just user_id where appropriate
-- Note: Most of these should probably reference auth.users(id) directly instead of profiles
ALTER TABLE public.space_members 
ADD CONSTRAINT space_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_points 
ADD CONSTRAINT user_points_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.point_transactions 
ADD CONSTRAINT point_transactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_levels 
ADD CONSTRAINT user_levels_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_current_level 
ADD CONSTRAINT user_current_level_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.posts 
ADD CONSTRAINT posts_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.post_interactions 
ADD CONSTRAINT post_interactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;