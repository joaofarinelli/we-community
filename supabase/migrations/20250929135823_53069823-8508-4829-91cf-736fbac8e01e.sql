-- Create course-images bucket for module thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-images', 'course-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Course images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload course images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own course images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own course images" ON storage.objects;

-- Create policies for course images
-- Public read access for course images
CREATE POLICY "Course images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'course-images');

-- Allow authenticated users to upload course images
CREATE POLICY "Users can upload course images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'course-images'
  AND auth.role() = 'authenticated'
);

-- Allow users to update course images
CREATE POLICY "Users can update course images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'course-images'
  AND auth.role() = 'authenticated'
);

-- Allow users to delete course images
CREATE POLICY "Users can delete course images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'course-images'
  AND auth.role() = 'authenticated'
);