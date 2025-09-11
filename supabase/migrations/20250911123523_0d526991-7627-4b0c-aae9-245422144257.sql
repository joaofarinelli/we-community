-- Add new fields to payment_provider_configs table
ALTER TABLE public.payment_provider_configs 
ADD COLUMN IF NOT EXISTS webhook_url TEXT,
ADD COLUMN IF NOT EXISTS boleto_expiration_days INTEGER DEFAULT 7;

-- Create payment_webhook_logs table for audit
CREATE TABLE IF NOT EXISTS public.payment_webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID REFERENCES public.payments(id),
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  webhook_data JSONB NOT NULL DEFAULT '{}',
  processing_status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payment_webhook_logs
ALTER TABLE public.payment_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for payment_webhook_logs
CREATE POLICY "Company owners can view webhook logs" 
ON public.payment_webhook_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.payments p
    JOIN public.profiles pr ON pr.company_id = p.company_id
    WHERE p.id = payment_webhook_logs.payment_id
    AND pr.user_id = auth.uid()
    AND pr.role IN ('owner', 'admin')
    AND pr.is_active = true
  )
);

CREATE POLICY "System can create webhook logs" 
ON public.payment_webhook_logs 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_payment_webhook_logs_payment_id ON public.payment_webhook_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_logs_provider ON public.payment_webhook_logs(provider);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_logs_processed_at ON public.payment_webhook_logs(processed_at);

-- Update the update trigger to include new columns
CREATE TRIGGER update_payment_provider_configs_updated_at
BEFORE UPDATE ON public.payment_provider_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();