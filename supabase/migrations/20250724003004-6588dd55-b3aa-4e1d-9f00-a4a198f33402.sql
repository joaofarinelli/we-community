-- Create storage buckets for post attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('post-images', 'post-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('post-documents', 'post-documents', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain']);

-- Create policies for post images (public)
CREATE POLICY "Anyone can view post images"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own post images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'post-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own post images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policies for post documents (private)
CREATE POLICY "Users can view documents in their company"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'post-documents'
  AND EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.company_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Authenticated users can upload post documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-documents' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.company_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can update their own post documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'post-documents' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can delete their own post documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-documents' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);