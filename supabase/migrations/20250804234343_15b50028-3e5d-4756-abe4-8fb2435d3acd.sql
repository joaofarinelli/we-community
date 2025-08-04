-- Create storage buckets for chat attachments
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('chat-images', 'chat-images', true),
  ('chat-documents', 'chat-documents', false);

-- Create policies for chat images bucket
CREATE POLICY "Chat images are viewable by company members" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'chat-images' AND EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND company_id = get_user_company_id()
));

CREATE POLICY "Users can upload chat images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own chat images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own chat images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policies for chat documents bucket
CREATE POLICY "Chat documents are viewable by company members" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'chat-documents' AND EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND company_id = get_user_company_id()
));

CREATE POLICY "Users can upload chat documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'chat-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own chat documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'chat-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own chat documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'chat-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Update messages table to support attachments
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_name TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_type TEXT;