-- Create storage bucket for module thumbnails
INSERT INTO storage.buckets (id, name, public) 
VALUES ('module-thumbnails', 'module-thumbnails', true);

-- Create storage policies for module thumbnails
CREATE POLICY "Module thumbnails are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'module-thumbnails');

CREATE POLICY "Company owners can upload module thumbnails" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'module-thumbnails' AND auth.uid() IN (
  SELECT user_id FROM public.profiles WHERE role = 'owner'
));

CREATE POLICY "Company owners can update module thumbnails" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'module-thumbnails' AND auth.uid() IN (
  SELECT user_id FROM public.profiles WHERE role = 'owner'
));

CREATE POLICY "Company owners can delete module thumbnails" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'module-thumbnails' AND auth.uid() IN (
  SELECT user_id FROM public.profiles WHERE role = 'owner'
));