-- Add course banner URL to companies table
ALTER TABLE public.companies 
ADD COLUMN course_banner_url TEXT;

-- Create storage bucket for course banners
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-banners', 'course-banners', true);

-- Create policies for course banner uploads
CREATE POLICY "Company owners can upload course banners" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'course-banners' AND auth.uid() IS NOT NULL);

CREATE POLICY "Company owners can update course banners" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'course-banners' AND auth.uid() IS NOT NULL);

CREATE POLICY "Company owners can delete course banners" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'course-banners' AND auth.uid() IS NOT NULL);

CREATE POLICY "Course banners are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'course-banners');