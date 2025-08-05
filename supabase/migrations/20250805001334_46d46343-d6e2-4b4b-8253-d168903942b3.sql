-- Fix RLS policies for company-logos bucket to work with multi-company users
DROP POLICY IF EXISTS "Company owners can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Company owners can update their logos" ON storage.objects;
DROP POLICY IF EXISTS "Company owners can delete their logos" ON storage.objects;
DROP POLICY IF EXISTS "Everyone can view company logos" ON storage.objects;

-- Create improved policies that work with multi-company setups
CREATE POLICY "Company owners can upload logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'company-logos' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = 'owner'
    AND p.company_id::text = (storage.foldername(name))[1]
    AND p.is_active = true
  )
);

CREATE POLICY "Company owners can update their logos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'company-logos' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = 'owner'
    AND p.company_id::text = (storage.foldername(name))[1]
    AND p.is_active = true
  )
);

CREATE POLICY "Company owners can delete their logos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'company-logos' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = 'owner'
    AND p.company_id::text = (storage.foldername(name))[1]
    AND p.is_active = true
  )
);

CREATE POLICY "Everyone can view company logos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'company-logos');