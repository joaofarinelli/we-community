-- Create Cae Club company with owner profile
DO $$
DECLARE
    new_company_id uuid;
    user_id_val uuid := 'e0f86579-0b6c-49f4-a291-5a17c6bbaf36';
BEGIN
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
END $$;