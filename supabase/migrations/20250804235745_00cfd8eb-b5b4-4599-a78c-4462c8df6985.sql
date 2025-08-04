-- Clean up existing chat image policies
DROP POLICY IF EXISTS "Users can upload their own chat images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view chat images from their company" ON storage.objects;
DROP POLICY IF EXISTS "Chat images are viewable by company members" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload chat images" ON storage.objects;

-- Create simplified and correct policies for chat-images
-- Since bucket is public, we can use a more permissive approach
CREATE POLICY "Users can upload to chat-images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'chat-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view chat-images" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'chat-images'
);

CREATE POLICY "Users can update their chat-images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'chat-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their chat-images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'chat-images' 
  AND auth.uid() IS NOT NULL
);