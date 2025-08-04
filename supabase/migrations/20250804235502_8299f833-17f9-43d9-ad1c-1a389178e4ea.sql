-- Policies for chat-images bucket
CREATE POLICY "Users can upload their own chat images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'chat-images' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can view chat images from their company" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'chat-images'
);

CREATE POLICY "Users can update their own chat images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'chat-images' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can delete their own chat images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'chat-images' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);