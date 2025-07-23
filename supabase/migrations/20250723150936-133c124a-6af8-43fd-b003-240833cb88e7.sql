-- Create posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL,
  company_id UUID NOT NULL,
  author_id UUID NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'poll')),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_announcement BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post_interactions table
CREATE TABLE public.post_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'love', 'comment')),
  comment_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, type)
);

-- Create space_members table
CREATE TABLE public.space_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(space_id, user_id)
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts
CREATE POLICY "Users can view posts in their company spaces" 
ON public.posts 
FOR SELECT 
USING (company_id = get_user_company_id());

CREATE POLICY "Users can create posts in their company spaces" 
ON public.posts 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id() AND auth.uid() = author_id);

CREATE POLICY "Authors can update their own posts" 
ON public.posts 
FOR UPDATE 
USING (company_id = get_user_company_id() AND auth.uid() = author_id);

CREATE POLICY "Authors and admins can delete posts" 
ON public.posts 
FOR DELETE 
USING (company_id = get_user_company_id() AND (auth.uid() = author_id OR is_company_owner()));

-- RLS Policies for post_interactions
CREATE POLICY "Users can view interactions in their company" 
ON public.post_interactions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.posts 
  WHERE posts.id = post_interactions.post_id 
  AND posts.company_id = get_user_company_id()
));

CREATE POLICY "Users can create their own interactions" 
ON public.post_interactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM public.posts 
  WHERE posts.id = post_interactions.post_id 
  AND posts.company_id = get_user_company_id()
));

CREATE POLICY "Users can update their own interactions" 
ON public.post_interactions 
FOR UPDATE 
USING (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM public.posts 
  WHERE posts.id = post_interactions.post_id 
  AND posts.company_id = get_user_company_id()
));

CREATE POLICY "Users can delete their own interactions" 
ON public.post_interactions 
FOR DELETE 
USING (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM public.posts 
  WHERE posts.id = post_interactions.post_id 
  AND posts.company_id = get_user_company_id()
));

-- RLS Policies for space_members
CREATE POLICY "Users can view members in their company spaces" 
ON public.space_members 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.spaces 
  WHERE spaces.id = space_members.space_id 
  AND spaces.company_id = get_user_company_id()
));

CREATE POLICY "Users can join spaces in their company" 
ON public.space_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM public.spaces 
  WHERE spaces.id = space_members.space_id 
  AND spaces.company_id = get_user_company_id()
));

CREATE POLICY "Users can leave spaces" 
ON public.space_members 
FOR DELETE 
USING (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM public.spaces 
  WHERE spaces.id = space_members.space_id 
  AND spaces.company_id = get_user_company_id()
));

-- Create triggers for timestamp updates
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_posts_space_id ON public.posts(space_id);
CREATE INDEX idx_posts_company_id ON public.posts(company_id);
CREATE INDEX idx_posts_author_id ON public.posts(author_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);

CREATE INDEX idx_post_interactions_post_id ON public.post_interactions(post_id);
CREATE INDEX idx_post_interactions_user_id ON public.post_interactions(user_id);

CREATE INDEX idx_space_members_space_id ON public.space_members(space_id);
CREATE INDEX idx_space_members_user_id ON public.space_members(user_id);