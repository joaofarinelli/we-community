-- Add current user as super admin (for testing)
-- This is safe because it only adds the currently authenticated user
INSERT INTO public.super_admins (user_id, email, is_active)
SELECT auth.uid(), auth.email(), true
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET
  is_active = true,
  updated_at = now();