-- Fix foreign key relationships after profiles table changes

-- First, let's ensure all tables that reference profiles have proper foreign keys
-- Since profiles now uses a composite key (user_id, company_id), we need to adjust references

-- For posts table - add foreign key to profiles via user_id and company_id
DO $$ 
BEGIN
    -- Check if foreign key already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'posts_author_profile_fkey' 
        AND table_name = 'posts'
    ) THEN
        ALTER TABLE public.posts 
        ADD CONSTRAINT posts_author_profile_fkey 
        FOREIGN KEY (author_id, company_id) 
        REFERENCES public.profiles(user_id, company_id);
    END IF;
END $$;

-- For post_interactions table - add foreign key to profiles via user_id and company_id
DO $$ 
BEGIN
    -- Add company_id to post_interactions if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'post_interactions' 
        AND column_name = 'company_id'
    ) THEN
        ALTER TABLE public.post_interactions ADD COLUMN company_id uuid;
        
        -- Update existing records to have the correct company_id
        UPDATE public.post_interactions 
        SET company_id = (
            SELECT p.company_id 
            FROM public.posts p 
            WHERE p.id = post_interactions.post_id
        );
        
        -- Make it NOT NULL after populating
        ALTER TABLE public.post_interactions ALTER COLUMN company_id SET NOT NULL;
    END IF;
    
    -- Add foreign key constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'post_interactions_user_profile_fkey' 
        AND table_name = 'post_interactions'
    ) THEN
        ALTER TABLE public.post_interactions 
        ADD CONSTRAINT post_interactions_user_profile_fkey 
        FOREIGN KEY (user_id, company_id) 
        REFERENCES public.profiles(user_id, company_id);
    END IF;
END $$;

-- For space_members table - add foreign key to profiles via user_id and company_id
DO $$ 
BEGIN
    -- Add company_id to space_members if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'space_members' 
        AND column_name = 'company_id'
    ) THEN
        ALTER TABLE public.space_members ADD COLUMN company_id uuid;
        
        -- Update existing records to have the correct company_id
        UPDATE public.space_members 
        SET company_id = (
            SELECT s.company_id 
            FROM public.spaces s 
            WHERE s.id = space_members.space_id
        );
        
        -- Make it NOT NULL after populating
        ALTER TABLE public.space_members ALTER COLUMN company_id SET NOT NULL;
    END IF;
    
    -- Add foreign key constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'space_members_user_profile_fkey' 
        AND table_name = 'space_members'
    ) THEN
        ALTER TABLE public.space_members 
        ADD CONSTRAINT space_members_user_profile_fkey 
        FOREIGN KEY (user_id, company_id) 
        REFERENCES public.profiles(user_id, company_id);
    END IF;
END $$;