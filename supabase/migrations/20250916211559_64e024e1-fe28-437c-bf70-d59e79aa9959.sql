-- Update the can_user_see_space function to allow admins/owners to see all spaces in their company
CREATE OR REPLACE FUNCTION public.can_user_see_space(space_id uuid)
RETURNS boolean AS $$
DECLARE
    current_user_id uuid;
    user_company_id uuid;
    user_role text;
    space_company_id uuid;
    space_visibility text;
    is_space_member boolean;
    has_group_access boolean;
BEGIN
    -- Get current user ID from auth
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RETURN false;
    END IF;

    -- Get user's company and role
    SELECT company_id, role INTO user_company_id, user_role
    FROM public.profiles 
    WHERE id = current_user_id;

    IF user_company_id IS NULL THEN
        RETURN false;
    END IF;

    -- Get space details
    SELECT company_id, visibility INTO space_company_id, space_visibility
    FROM public.spaces 
    WHERE id = space_id;

    -- Space must belong to user's company
    IF space_company_id != user_company_id THEN
        RETURN false;
    END IF;

    -- Company admins and owners can see all spaces in their company
    IF user_role IN ('admin', 'owner') THEN
        RETURN true;
    END IF;

    -- Public spaces are visible to all company members
    IF space_visibility = 'public' THEN
        RETURN true;
    END IF;

    -- Check if user is a direct member of the space
    SELECT EXISTS(
        SELECT 1 FROM public.space_members 
        WHERE space_id = space_id AND user_id = current_user_id
    ) INTO is_space_member;

    IF is_space_member THEN
        RETURN true;
    END IF;

    -- Check access through access groups
    SELECT EXISTS(
        SELECT 1 
        FROM public.access_group_members agm
        JOIN public.access_group_spaces ags ON agm.access_group_id = ags.access_group_id
        WHERE agm.user_id = current_user_id 
        AND ags.space_id = space_id
    ) INTO has_group_access;

    RETURN has_group_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;