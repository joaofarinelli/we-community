-- Create avatars bucket for user profile images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Create policy to allow users to view all avatars (public bucket)
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

-- Create policy to allow users to upload their own avatar
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy to allow users to update their own avatar
CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy to allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);