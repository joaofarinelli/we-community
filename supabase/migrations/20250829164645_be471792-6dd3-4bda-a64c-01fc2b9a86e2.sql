-- Add privacy settings for phone number in profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS hide_phone_from_members boolean NOT NULL DEFAULT false;