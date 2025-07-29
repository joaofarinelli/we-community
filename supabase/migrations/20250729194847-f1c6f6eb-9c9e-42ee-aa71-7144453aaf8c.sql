-- Create storage bucket for event banners
INSERT INTO storage.buckets (id, name, public) VALUES ('event-banners', 'event-banners', true);

-- Create storage policies for event banners
CREATE POLICY "Anyone can view event banners" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'event-banners');

CREATE POLICY "Authenticated users can upload event banners" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'event-banners' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update event banners" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'event-banners' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete event banners" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'event-banners' AND auth.role() = 'authenticated');

-- Add new columns to events table
ALTER TABLE public.events 
ADD COLUMN location_type TEXT DEFAULT 'indefinido' CHECK (location_type IN ('presencial', 'online', 'indefinido')),
ADD COLUMN online_link TEXT,
ADD COLUMN location_address TEXT,
ADD COLUMN location_coordinates TEXT; -- Using TEXT instead of POINT for JSON coordinates