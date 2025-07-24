-- Add image and level requirement fields to challenges table
ALTER TABLE public.challenges 
ADD COLUMN image_url TEXT,
ADD COLUMN required_level_id UUID REFERENCES public.user_levels(id),
ADD COLUMN is_available_for_all_levels BOOLEAN NOT NULL DEFAULT true;

-- Create storage bucket for challenge images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('challenge-images', 'challenge-images', true);

-- Storage policies for challenge images
CREATE POLICY "Anyone can view challenge images"
ON storage.objects FOR SELECT
USING (bucket_id = 'challenge-images');

CREATE POLICY "Company owners can upload challenge images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'challenge-images'
  AND auth.uid() IS NOT NULL
  AND public.is_company_owner()
);

CREATE POLICY "Company owners can update challenge images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'challenge-images' AND public.is_company_owner());

CREATE POLICY "Company owners can delete challenge images"
ON storage.objects FOR DELETE
USING (bucket_id = 'challenge-images' AND public.is_company_owner());