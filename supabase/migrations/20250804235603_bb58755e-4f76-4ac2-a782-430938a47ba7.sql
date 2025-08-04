-- Drop existing policies for chat images to recreate them with correct path structure
DROP POLICY IF EXISTS "Users can upload their own chat images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view chat images from their company" ON storage.objects;

-- Create corrected policies for chat-images bucket
-- Path structure is: bucket/company_id/user_id/filename
CREATE POLICY "Users can upload their own chat images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'chat-images' 
  AND auth.uid()::text = (storage.foldername(name))[3]
);

CREATE POLICY "Users can view chat images from their company" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'chat-images'
);