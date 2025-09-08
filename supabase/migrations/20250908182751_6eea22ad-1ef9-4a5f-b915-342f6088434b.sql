-- Add image_url column to announcements table
ALTER TABLE public.announcements 
ADD COLUMN image_url text;

-- Update the create_announcement_and_assign function to handle image_url
CREATE OR REPLACE FUNCTION public.create_announcement_and_assign(
  p_company_id uuid,
  p_title text,
  p_content text,
  p_is_mandatory boolean,
  p_user_ids uuid[],
  p_expires_at timestamp with time zone DEFAULT NULL,
  p_image_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  announcement_id uuid;
  user_id_item uuid;
BEGIN
  -- Create the announcement
  INSERT INTO public.announcements (
    company_id, title, content, is_mandatory, expires_at, image_url, created_by
  ) VALUES (
    p_company_id, p_title, p_content, p_is_mandatory, p_expires_at, p_image_url, auth.uid()
  ) RETURNING id INTO announcement_id;
  
  -- Assign to recipients
  FOREACH user_id_item IN ARRAY p_user_ids
  LOOP
    INSERT INTO public.announcement_recipients (
      announcement_id, user_id, company_id
    ) VALUES (
      announcement_id, user_id_item, p_company_id
    );
  END LOOP;
  
  RETURN announcement_id;
END;
$$;

-- Create storage bucket for announcement images
INSERT INTO storage.buckets (id, name, public)
VALUES ('announcement-images', 'announcement-images', true);

-- Create RLS policies for announcement images
CREATE POLICY "Users can upload announcement images in their company"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'announcement-images' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.is_active = true
    AND p.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Announcement images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'announcement-images');

CREATE POLICY "Users can update their announcement images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'announcement-images' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.is_active = true
    AND p.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Users can delete their announcement images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'announcement-images' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.is_active = true
    AND p.role IN ('owner', 'admin')
  )
);