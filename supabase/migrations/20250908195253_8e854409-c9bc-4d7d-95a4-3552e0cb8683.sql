-- Update process_invite_acceptance function to handle tags from import
CREATE OR REPLACE FUNCTION public.process_invite_acceptance(p_token text, p_user_id uuid, p_first_name text, p_last_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  invite_record RECORD;
  course_id_item uuid;
  tag_id_item uuid;
  new_profile_id uuid;
  tag_ids_from_import text[];
BEGIN
  -- Get invite details
  SELECT * INTO invite_record
  FROM public.user_invites
  WHERE token = p_token 
  AND status = 'pending' 
  AND expires_at > now();
  
  IF invite_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite');
  END IF;
  
  -- Create profile
  INSERT INTO public.profiles (user_id, company_id, first_name, last_name, email, role, is_active)
  VALUES (p_user_id, invite_record.company_id, p_first_name, p_last_name, invite_record.email, invite_record.role, true)
  RETURNING id INTO new_profile_id;
  
  -- Check if course_access contains tag IDs (from CSV import)
  -- If the array contains UUIDs that don't exist in courses table, treat them as tag IDs
  IF jsonb_array_length(invite_record.course_access) > 0 THEN
    -- Extract tag IDs that were temporarily stored in course_access
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(invite_record.course_access)::text
      WHERE NOT EXISTS (
        SELECT 1 FROM public.courses 
        WHERE id = (jsonb_array_elements_text(invite_record.course_access))::uuid
      )
    ) INTO tag_ids_from_import;
    
    -- Assign tags from import
    IF array_length(tag_ids_from_import, 1) > 0 THEN
      FOR tag_id_item IN 
        SELECT unnest(tag_ids_from_import)::uuid
      LOOP
        -- Verify tag exists in company before assigning
        IF EXISTS (
          SELECT 1 FROM public.tags 
          WHERE id = tag_id_item AND company_id = invite_record.company_id
        ) THEN
          INSERT INTO public.user_tags (user_id, tag_id, company_id, assigned_by)
          VALUES (p_user_id, tag_id_item, invite_record.company_id, invite_record.invited_by)
          ON CONFLICT (user_id, tag_id) DO NOTHING;
        END IF;
      END LOOP;
    END IF;
    
    -- Grant course access for actual course IDs
    FOR course_id_item IN 
      SELECT (jsonb_array_elements_text(invite_record.course_access))::uuid
      WHERE EXISTS (
        SELECT 1 FROM public.courses 
        WHERE id = (jsonb_array_elements_text(invite_record.course_access))::uuid
      )
    LOOP
      INSERT INTO public.user_course_access (user_id, course_id, company_id, granted_by)
      VALUES (p_user_id, course_id_item, invite_record.company_id, invite_record.invited_by);
    END LOOP;
  END IF;
  
  -- Mark invite as accepted
  UPDATE public.user_invites 
  SET status = 'accepted', accepted_at = now()
  WHERE id = invite_record.id;
  
  -- Add user to public spaces
  PERFORM public.add_user_to_public_spaces(p_user_id, invite_record.company_id);
  
  RETURN jsonb_build_object(
    'success', true, 
    'company_id', invite_record.company_id,
    'role', invite_record.role
  );
END;
$function$;