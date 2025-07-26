-- Create Cae Club company for existing user using the function
SELECT create_user_profile_for_company(
    'e0f86579-0b6c-49f4-a291-5a17c6bbaf36'::uuid, 
    (
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
        ) RETURNING id
    ),
    'João',
    'Farinelli',
    'jv.farinelli@gmail.com',
    'owner'
);