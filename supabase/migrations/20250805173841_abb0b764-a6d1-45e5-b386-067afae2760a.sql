-- Add profession and location fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN profession text,
ADD COLUMN location text;