-- Add maintenance mode columns to companies table
ALTER TABLE public.companies 
ADD COLUMN maintenance_mode boolean NOT NULL DEFAULT false,
ADD COLUMN maintenance_message text;

-- Add comment to explain the columns
COMMENT ON COLUMN public.companies.maintenance_mode IS 'When true, only admins/owners can access the platform';
COMMENT ON COLUMN public.companies.maintenance_message IS 'Custom message shown to users when in maintenance mode';