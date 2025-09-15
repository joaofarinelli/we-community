-- Add payment fields to events table
ALTER TABLE public.events 
ADD COLUMN is_paid boolean NOT NULL DEFAULT false,
ADD COLUMN price_coins integer DEFAULT 0,
ADD COLUMN payment_required boolean NOT NULL DEFAULT false;