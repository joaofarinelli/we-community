-- Fix chat-documents storage policies to match the correct path structure
-- The upload path is: company_id/user_id/filename
-- But the policy was checking (storage.foldername(name))[1] = auth.uid()
-- Which compares company_id against user_id

-- Drop existing incorrect policies
DROP POLICY IF EXISTS "Users can upload chat documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own chat documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat documents" ON storage.objects;

-- Create corrected policies for chat documents
-- The path structure is: company_id/user_id/filename
-- So we need to check (storage.foldername(name))[2] = auth.uid() for user verification
-- And the company_id should match the user's company

CREATE POLICY "Users can upload chat documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'chat-documents' 
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND (storage.foldername(name))[1] = get_user_company_id()::text
);

CREATE POLICY "Users can update their own chat documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'chat-documents' 
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND (storage.foldername(name))[1] = get_user_company_id()::text
);

CREATE POLICY "Users can delete their own chat documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'chat-documents' 
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND (storage.foldername(name))[1] = get_user_company_id()::text
);