-- Create super admin configurations table
CREATE TABLE IF NOT EXISTS public.super_admin_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key text NOT NULL UNIQUE,
  config_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.super_admin_configs ENABLE ROW LEVEL SECURITY;

-- Create policies for super admin configs
CREATE POLICY "Super admins can manage configs"
ON public.super_admin_configs
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_super_admin_configs_updated_at
  BEFORE UPDATE ON public.super_admin_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default bug reports configuration
INSERT INTO public.super_admin_configs (config_key, config_value, description)
VALUES (
  'bug_reports',
  '{"email": null, "enabled": true}'::jsonb,
  'Configurações para relatórios de bugs - email de destino e status de ativação'
)
ON CONFLICT (config_key) DO NOTHING;