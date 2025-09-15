-- Add WhatsApp configuration columns to companies table
ALTER TABLE public.companies 
ADD COLUMN whatsapp_enabled boolean DEFAULT false,
ADD COLUMN whatsapp_phone text,
ADD COLUMN whatsapp_message text DEFAULT 'Olá! Gostaria de saber mais informações.';