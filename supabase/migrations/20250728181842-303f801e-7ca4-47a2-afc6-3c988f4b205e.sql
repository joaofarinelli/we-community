-- Add coin_name field to companies table
ALTER TABLE public.companies 
ADD COLUMN coin_name text DEFAULT 'WomanCoins';