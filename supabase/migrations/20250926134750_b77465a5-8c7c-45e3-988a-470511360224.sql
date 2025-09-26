-- Add new payment fields to events table
ALTER TABLE public.events 
ADD COLUMN external_payment_url TEXT,
ADD COLUMN payment_approval_required BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN payment_type TEXT NOT NULL DEFAULT 'free' CHECK (payment_type IN ('free', 'coins', 'external', 'both'));

-- Add new payment status fields to event_participants table  
ALTER TABLE public.event_participants
ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'none' CHECK (payment_status IN ('none', 'pending_coins', 'pending_external', 'approved', 'cancelled')),
ADD COLUMN payment_method TEXT CHECK (payment_method IN ('coins', 'external', 'free')),
ADD COLUMN external_payment_data JSONB,
ADD COLUMN payment_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN payment_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN payment_approved_by UUID REFERENCES auth.users(id);

-- Update existing paid events to use coins payment type
UPDATE public.events 
SET payment_type = 'coins' 
WHERE payment_required = true OR is_paid = true;

-- Update existing participants of paid events to have approved status if they're already participants
UPDATE public.event_participants ep
SET payment_status = 'approved', 
    payment_method = 'coins',
    payment_approved_at = ep.joined_at
FROM public.events e
WHERE ep.event_id = e.id 
  AND (e.payment_required = true OR e.is_paid = true);