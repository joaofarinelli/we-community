-- Add banner URL columns to companies table
ALTER TABLE public.companies 
ADD COLUMN trails_banner_url text,
ADD COLUMN members_banner_url text,
ADD COLUMN ranking_banner_url text,
ADD COLUMN marketplace_banner_url text,
ADD COLUMN store_banner_url text,
ADD COLUMN bank_banner_url text,
ADD COLUMN challenges_banner_url text;

-- Create storage bucket for page banners
INSERT INTO storage.buckets (id, name, public) 
VALUES ('page-banners', 'page-banners', true);

-- Create storage policies for page banners
CREATE POLICY "Page banner images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'page-banners');

CREATE POLICY "Company owners can upload page banners" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'page-banners' AND auth.uid() IS NOT NULL);

CREATE POLICY "Company owners can update page banners" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'page-banners' AND auth.uid() IS NOT NULL);

CREATE POLICY "Company owners can delete page banners" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'page-banners' AND auth.uid() IS NOT NULL);