-- Add custom icon fields to spaces table
ALTER TABLE public.spaces 
ADD COLUMN custom_icon_type text CHECK (custom_icon_type IN ('emoji', 'image', 'default')) DEFAULT 'default',
ADD COLUMN custom_icon_value text;

-- Create storage bucket for space icons
INSERT INTO storage.buckets (id, name, public) 
VALUES ('space-icons', 'space-icons', true);

-- Create policies for space icons bucket
CREATE POLICY "Users can view space icons" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'space-icons');

CREATE POLICY "Company members can upload space icons" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'space-icons' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Company members can update space icons" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'space-icons' AND auth.uid() IS NOT NULL);

CREATE POLICY "Company members can delete space icons" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'space-icons' AND auth.uid() IS NOT NULL);