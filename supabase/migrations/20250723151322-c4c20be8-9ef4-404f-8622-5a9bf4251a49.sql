-- Add foreign key constraints
ALTER TABLE public.posts 
ADD CONSTRAINT posts_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(user_id);

ALTER TABLE public.posts 
ADD CONSTRAINT posts_space_id_fkey 
FOREIGN KEY (space_id) REFERENCES public.spaces(id);

ALTER TABLE public.posts 
ADD CONSTRAINT posts_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id);

ALTER TABLE public.post_interactions 
ADD CONSTRAINT post_interactions_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.post_interactions 
ADD CONSTRAINT post_interactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

ALTER TABLE public.space_members 
ADD CONSTRAINT space_members_space_id_fkey 
FOREIGN KEY (space_id) REFERENCES public.spaces(id) ON DELETE CASCADE;

ALTER TABLE public.space_members 
ADD CONSTRAINT space_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);