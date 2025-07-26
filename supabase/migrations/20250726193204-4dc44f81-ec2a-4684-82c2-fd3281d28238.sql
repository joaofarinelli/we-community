-- Create Cae Club company by properly handling triggers
DO $$
DECLARE
    new_company_id uuid;
    user_id_val uuid := 'e0f86579-0b6c-49f4-a291-5a17c6bbaf36';
BEGIN
    -- Temporarily disable all relevant triggers
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

    -- Create the owner profile
    INSERT INTO public.profiles (
        user_id,
        company_id,
        first_name,
        last_name,
        email,
        role,
        is_active
    ) VALUES (
        user_id_val,
        new_company_id,
        'João',
        'Farinelli',
        'jv.farinelli@gmail.com',
        'owner',
        true
    );

    -- Manually create the default space category
    INSERT INTO public.space_categories (company_id, name, order_index, created_by)
    VALUES (new_company_id, 'Espaços', 0, user_id_val);

    -- Create default levels for the company
    PERFORM public.create_default_levels(new_company_id, user_id_val);

    -- Recreate the triggers
    CREATE TRIGGER create_default_category_on_company_creation
        AFTER INSERT ON public.companies
        FOR EACH ROW
        EXECUTE FUNCTION public.create_default_space_category();
        
    CREATE TRIGGER create_default_levels_on_company_creation
        AFTER INSERT ON public.companies
        FOR EACH ROW
        EXECUTE FUNCTION public.create_default_levels_trigger();
END $$;