-- Atualizar Cae Club para funcionar no editor do Lovable
UPDATE public.companies 
SET 
    subdomain = NULL,
    custom_domain = 'lovable.dev',
    custom_domain_status = 'verified'
WHERE name = 'Cae Club';