-- Fix the security warning by replacing the function properly
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create a sample company to get started
INSERT INTO public.companies (name, slug, coin_name) 
VALUES ('We Plataforma', 'we-plataforma', 'WomanCoins')
ON CONFLICT (slug) DO NOTHING;