-- Create Cae Club company step by step
DO $$
DECLARE
    new_company_id uuid;
    user_id_val uuid := 'e0f86579-0b6c-49f4-a291-5a17c6bbaf36';
    profile_id uuid;
BEGIN
    -- Temporarily disable triggers
    DROP TRIGGER IF EXISTS create_default_category_on_company_creation ON public.companies;
    DROP TRIGGER IF EXISTS create_default_levels_on_company_creation ON public.companies;
    
    -- Create the company
    INSERT INTO public.companies (
        name,
        subdomain,
        plan,
        status,
        theme_mode,
        primary_color,
        text_color,
        button_text_color
    ) VALUES (
        'Cae Club',
        'cae-club',
        'free',
        'active',
        'light',
        '#c05474',
        '#545759',
        '#FFFFFF'
    ) RETURNING id INTO new_company_id;

    -- Use the function to create profile (it will handle the uniqueness constraints)
    SELECT create_user_profile_for_company(
        user_id_val,
        new_company_id,
        'João',
        'Farinelli',
        'jv.farinelli@gmail.com',
        'owner'
    ) INTO profile_id;

    -- Recreate the triggers
    CREATE TRIGGER create_default_category_on_company_creation
        AFTER INSERT ON public.companies
        FOR EACH ROW
        EXECUTE FUNCTION public.create_default_space_category();
        
    CREATE TRIGGER create_default_levels_on_company_creation
        AFTER INSERT ON public.companies
        FOR EACH ROW
        EXECUTE FUNCTION public.create_default_levels_trigger();
        
    RAISE NOTICE 'Successfully created Cae Club company with ID: %, Profile ID: %', new_company_id, profile_id;
END $$;