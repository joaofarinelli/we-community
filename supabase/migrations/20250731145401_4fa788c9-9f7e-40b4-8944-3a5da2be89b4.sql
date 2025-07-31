-- Create trail_badges table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.trail_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  badge_type TEXT NOT NULL, -- 'completion', 'milestone', 'achievement'
  icon_name TEXT DEFAULT 'Award',
  icon_color TEXT DEFAULT '#FFD700',
  background_color TEXT DEFAULT '#1E40AF',
  coins_reward INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trail_badges ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Company owners can manage trail badges"
  ON public.trail_badges
  FOR ALL
  USING (company_id = get_user_company_id() AND is_company_owner())
  WITH CHECK (company_id = get_user_company_id() AND is_company_owner() AND auth.uid() = created_by);

CREATE POLICY "Users can view active badges in their company"
  ON public.trail_badges
  FOR SELECT
  USING (company_id = get_user_company_id() AND is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_trail_badges_updated_at
  BEFORE UPDATE ON public.trail_badges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create some default badges
INSERT INTO public.trail_badges (company_id, name, description, badge_type, icon_name, icon_color, background_color, coins_reward, created_by)
SELECT 
  c.id,
  'Completou a Trilha',
  'Parabéns! Você completou toda a trilha com sucesso.',
  'completion',
  'Trophy',
  '#FFD700',
  '#1E40AF',
  100,
  p.user_id
FROM public.companies c
JOIN public.profiles p ON p.company_id = c.id AND p.role = 'owner'
WHERE NOT EXISTS (
  SELECT 1 FROM public.trail_badges tb WHERE tb.company_id = c.id
);

INSERT INTO public.trail_badges (company_id, name, description, badge_type, icon_name, icon_color, background_color, coins_reward, created_by)
SELECT 
  c.id,
  'Primeira Etapa',
  'Você completou sua primeira etapa na trilha!',
  'milestone',
  'Star',
  '#10B981',
  '#065F46',
  25,
  p.user_id
FROM public.companies c
JOIN public.profiles p ON p.company_id = c.id AND p.role = 'owner'
WHERE NOT EXISTS (
  SELECT 1 FROM public.trail_badges tb WHERE tb.company_id = c.id AND tb.name = 'Primeira Etapa'
);