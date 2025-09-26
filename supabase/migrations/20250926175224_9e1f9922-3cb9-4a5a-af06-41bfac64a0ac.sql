-- Remove 'both' option from payment_type enum constraint in events table
ALTER TABLE public.events 
DROP CONSTRAINT IF EXISTS events_payment_type_check;

-- Add updated constraint without 'both' option
ALTER TABLE public.events 
ADD CONSTRAINT events_payment_type_check 
CHECK (payment_type IN ('free', 'coins', 'external'));

-- Update any existing events with 'both' payment type to use 'coins' instead
UPDATE public.events 
SET payment_type = 'coins' 
WHERE payment_type = 'both';