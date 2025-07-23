-- Add visibility column to spaces table
ALTER TABLE public.spaces 
ADD COLUMN visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'secret'));

-- Create function to check if user is space member
CREATE OR REPLACE FUNCTION public.is_space_member(space_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.space_members 
    WHERE space_members.space_id = is_space_member.space_id 
    AND space_members.user_id = is_space_member.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create function to check if user can see space
CREATE OR REPLACE FUNCTION public.can_user_see_space(space_id uuid, user_id uuid)
RETURNS boolean AS $$
DECLARE
  space_visibility text;
  user_company_id uuid;
  space_company_id uuid;
  is_company_owner boolean;
BEGIN
  -- Get space visibility and company
  SELECT visibility, company_id INTO space_visibility, space_company_id
  FROM public.spaces WHERE id = space_id;
  
  -- Get user company
  SELECT company_id INTO user_company_id
  FROM public.profiles WHERE profiles.user_id = can_user_see_space.user_id;
  
  -- Check if user is company owner
  SELECT public.is_company_owner() INTO is_company_owner;
  
  -- Different companies cannot see each other's spaces
  IF space_company_id != user_company_id THEN
    RETURN false;
  END IF;
  
  -- Company owners can see all spaces
  IF is_company_owner THEN
    RETURN true;
  END IF;
  
  -- Public spaces are visible to everyone in the company
  IF space_visibility = 'public' THEN
    RETURN true;
  END IF;
  
  -- Private and secret spaces require membership
  IF space_visibility IN ('private', 'secret') THEN
    RETURN public.is_space_member(space_id, user_id);
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create trigger function to add creator as space member
CREATE OR REPLACE FUNCTION public.add_space_creator_as_member()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.space_members (space_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically add creator as member
DROP TRIGGER IF EXISTS add_creator_as_member ON public.spaces;
CREATE TRIGGER add_creator_as_member
  AFTER INSERT ON public.spaces
  FOR EACH ROW
  EXECUTE FUNCTION public.add_space_creator_as_member();

-- Update RLS policy for spaces to use visibility rules
DROP POLICY IF EXISTS "Users can view spaces in their company" ON public.spaces;
CREATE POLICY "Users can view spaces based on visibility and membership" 
ON public.spaces 
FOR SELECT 
USING (public.can_user_see_space(id, auth.uid()));

-- Update RLS policy for posts to check space access
DROP POLICY IF EXISTS "Users can view posts in their company spaces" ON public.posts;
CREATE POLICY "Users can view posts in accessible spaces" 
ON public.posts 
FOR SELECT 
USING (
  company_id = public.get_user_company_id() 
  AND public.can_user_see_space(space_id, auth.uid())
);

-- Add policy for space members to update role (admins can manage members)
CREATE POLICY "Space admins can update member roles" 
ON public.space_members 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.space_members sm
    WHERE sm.space_id = space_members.space_id 
    AND sm.user_id = auth.uid() 
    AND sm.role = 'admin'
  )
  OR public.is_company_owner()
);