-- Create Cae Club company using Amanda as owner
DO $$
DECLARE
    new_company_id uuid;
    amanda_user_id uuid := '8beb8843-aeb0-4afd-a6b5-2bd90c2a1731';
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

    -- Update Amanda's profile to be owner of this new company
    UPDATE public.profiles 
    SET 
        company_id = new_company_id,
        role = 'owner',
        first_name = 'João',
        last_name = 'Farinelli', 
        email = 'jv.farinelli@gmail.com'
    WHERE user_id = amanda_user_id;

    -- Manually create the default space category
    INSERT INTO public.space_categories (company_id, name, order_index, created_by)
    VALUES (new_company_id, 'Espaços', 0, amanda_user_id);

    -- Create default levels for the company
    PERFORM public.create_default_levels(new_company_id, amanda_user_id);

    -- Recreate the triggers
    CREATE TRIGGER create_default_category_on_company_creation
        AFTER INSERT ON public.companies
        FOR EACH ROW
        EXECUTE FUNCTION public.create_default_space_category();
        
    CREATE TRIGGER create_default_levels_on_company_creation
        AFTER INSERT ON public.companies
        FOR EACH ROW
        EXECUTE FUNCTION public.create_default_levels_trigger();
        
    RAISE NOTICE 'Successfully created Cae Club company with ID: %', new_company_id;
END $$;