-- Add structured address fields to events table
ALTER TABLE public.events 
ADD COLUMN street text,
ADD COLUMN number text,
ADD COLUMN complement text,
ADD COLUMN neighborhood text,
ADD COLUMN city text,
ADD COLUMN state text,
ADD COLUMN postal_code text;