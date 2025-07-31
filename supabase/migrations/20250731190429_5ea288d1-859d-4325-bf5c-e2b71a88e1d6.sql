-- Add privacy settings to profiles table
ALTER TABLE public.profiles 
ADD COLUMN bio text,
ADD COLUMN avatar_url text,
ADD COLUMN show_email_to_others boolean DEFAULT true,
ADD COLUMN show_coins_to_others boolean DEFAULT true;