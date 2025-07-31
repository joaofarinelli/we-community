-- Check if trail_badges table exists and add missing columns if needed
DO $$
BEGIN
  -- Add icon_color column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trail_badges' AND column_name = 'icon_color') THEN
    ALTER TABLE public.trail_badges ADD COLUMN icon_color TEXT DEFAULT '#FFD700';
  END IF;
  
  -- Add background_color column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trail_badges' AND column_name = 'background_color') THEN
    ALTER TABLE public.trail_badges ADD COLUMN background_color TEXT DEFAULT '#1E40AF';
  END IF;
  
  -- Add icon_name column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trail_badges' AND column_name = 'icon_name') THEN
    ALTER TABLE public.trail_badges ADD COLUMN icon_name TEXT DEFAULT 'Award';
  END IF;
  
  -- Add description column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trail_badges' AND column_name = 'description') THEN
    ALTER TABLE public.trail_badges ADD COLUMN description TEXT;
  END IF;
  
  -- Add badge_type column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trail_badges' AND column_name = 'badge_type') THEN
    ALTER TABLE public.trail_badges ADD COLUMN badge_type TEXT NOT NULL DEFAULT 'completion';
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.trail_badges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Company owners can manage trail badges" ON public.trail_badges;
DROP POLICY IF EXISTS "Users can view active badges in their company" ON public.trail_badges;

-- Create RLS policies
CREATE POLICY "Company owners can manage trail badges"
  ON public.trail_badges
  FOR ALL
  USING (company_id = get_user_company_id() AND is_company_owner())
  WITH CHECK (company_id = get_user_company_id() AND is_company_owner());

CREATE POLICY "Users can view active badges in their company"
  ON public.trail_badges
  FOR SELECT
  USING (company_id = get_user_company_id() AND is_active = true);