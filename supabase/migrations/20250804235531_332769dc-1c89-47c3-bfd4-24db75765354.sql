-- Create missing SELECT policies for chat-images bucket
CREATE POLICY "Users can view chat images from their company" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'chat-images'
);

-- Create missing INSERT policy if it doesn't exist
DO $$ 
BEGIN
    -- Check if the INSERT policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Users can upload their own chat images'
    ) THEN
        EXECUTE '
        CREATE POLICY "Users can upload their own chat images" 
        ON storage.objects 
        FOR INSERT 
        WITH CHECK (
          bucket_id = ''chat-images'' 
          AND auth.uid()::text = (storage.foldername(name))[2]
        )';
    END IF;
END $$;