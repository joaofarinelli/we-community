
-- Adiciona coluna para armazenar a URL do favicon por empresa
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS favicon_url text;
