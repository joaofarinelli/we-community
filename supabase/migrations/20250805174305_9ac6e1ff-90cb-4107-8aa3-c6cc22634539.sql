-- Add privacy settings for profession and location fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN show_profession_to_others boolean DEFAULT true,
ADD COLUMN show_location_to_others boolean DEFAULT true;