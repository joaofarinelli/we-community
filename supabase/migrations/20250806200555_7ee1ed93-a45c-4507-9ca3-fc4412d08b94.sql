-- Create storage bucket for course banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-banners', 'course-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for course banner uploads (authenticated users)
CREATE POLICY "Anyone can view course banners" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'course-banners');

CREATE POLICY "Company owners can upload course banners" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'course-banners' AND auth.role() = 'authenticated');

CREATE POLICY "Company owners can update course banners" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'course-banners' AND auth.role() = 'authenticated');

CREATE POLICY "Company owners can delete course banners" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'course-banners' AND auth.role() = 'authenticated');