-- Create enum types for trails system
CREATE TYPE trail_status AS ENUM ('active', 'paused', 'completed');
CREATE TYPE field_type AS ENUM ('text', 'textarea', 'multiple_choice', 'scale', 'date', 'file_upload', 'task_status');
CREATE TYPE response_status AS ENUM ('pending', 'completed', 'skipped');

-- Create trails table (main journeys)
CREATE TABLE public.trails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status trail_status NOT NULL DEFAULT 'active',
  life_area TEXT,
  template_id UUID,
  progress_percentage INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.trails ENABLE ROW LEVEL SECURITY;

-- Create trail templates for reusable journey structures
CREATE TABLE public.trail_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  life_area TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.trail_templates ENABLE ROW LEVEL SECURITY;

-- Create trail stages (steps in the journey)
CREATE TABLE public.trail_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trail_id UUID,
  template_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  guidance_text TEXT,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT trail_stages_trail_or_template CHECK (
    (trail_id IS NOT NULL AND template_id IS NULL) OR 
    (trail_id IS NULL AND template_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.trail_stages ENABLE ROW LEVEL SECURITY;

-- Create trail fields (custom fields for each stage)
CREATE TABLE public.trail_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  field_type field_type NOT NULL,
  field_label TEXT NOT NULL,
  field_description TEXT,
  is_required BOOLEAN DEFAULT false,
  field_options JSONB, -- For multiple choice options, scale ranges, etc.
  order_index INTEGER NOT NULL DEFAULT 0,
  gamification_points INTEGER DEFAULT 0, -- Hidden points for completion
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trail_fields ENABLE ROW LEVEL SECURITY;

-- Create trail responses (user answers to fields)
CREATE TABLE public.trail_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trail_id UUID NOT NULL,
  stage_id UUID NOT NULL,
  field_id UUID NOT NULL,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  response_value JSONB, -- Flexible storage for different response types
  file_url TEXT, -- For file uploads
  status response_status DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trail_responses ENABLE ROW LEVEL SECURITY;

-- Create trail progress tracking
CREATE TABLE public.trail_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trail_id UUID NOT NULL,
  stage_id UUID NOT NULL,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  coins_earned INTEGER DEFAULT 0,
  badges_earned TEXT[], -- Array of badge names
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trail_id, stage_id, user_id)
);

-- Enable RLS
ALTER TABLE public.trail_progress ENABLE ROW LEVEL SECURITY;

-- Create trail badges (thematic badges for journeys)
CREATE TABLE public.trail_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT NOT NULL,
  color TEXT NOT NULL,
  badge_type TEXT NOT NULL, -- 'desperta', 'decidida', 'corajosa', 'em_movimento', 'celebrante'
  life_area TEXT,
  coins_reward INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.trail_badges ENABLE ROW LEVEL SECURITY;

-- Create user trail badges (earned badges)
CREATE TABLE public.user_trail_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  trail_id UUID NOT NULL,
  badge_id UUID NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, trail_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.user_trail_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trails
CREATE POLICY "Users can view their own trails" 
ON public.trails FOR SELECT 
USING (company_id = get_user_company_id() AND user_id = auth.uid());

CREATE POLICY "Company owners can view all trails" 
ON public.trails FOR SELECT 
USING (company_id = get_user_company_id() AND is_company_owner());

CREATE POLICY "Users can create their own trails" 
ON public.trails FOR INSERT 
WITH CHECK (company_id = get_user_company_id() AND user_id = auth.uid() AND created_by = auth.uid());

CREATE POLICY "Company owners can create trails for users" 
ON public.trails FOR INSERT 
WITH CHECK (company_id = get_user_company_id() AND is_company_owner() AND created_by = auth.uid());

CREATE POLICY "Users can update their own trails" 
ON public.trails FOR UPDATE 
USING (company_id = get_user_company_id() AND user_id = auth.uid());

CREATE POLICY "Company owners can update all trails" 
ON public.trails FOR UPDATE 
USING (company_id = get_user_company_id() AND is_company_owner());

-- RLS Policies for trail templates
CREATE POLICY "Company owners can manage templates" 
ON public.trail_templates FOR ALL 
USING (company_id = get_user_company_id() AND is_company_owner())
WITH CHECK (company_id = get_user_company_id() AND is_company_owner() AND created_by = auth.uid());

CREATE POLICY "Users can view active templates" 
ON public.trail_templates FOR SELECT 
USING (company_id = get_user_company_id() AND is_active = true);

-- RLS Policies for trail stages
CREATE POLICY "Users can view stages of their trails" 
ON public.trail_stages FOR SELECT 
USING (
  (trail_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.trails t 
    WHERE t.id = trail_stages.trail_id 
    AND t.company_id = get_user_company_id() 
    AND (t.user_id = auth.uid() OR is_company_owner())
  )) OR
  (template_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.trail_templates tt 
    WHERE tt.id = trail_stages.template_id 
    AND tt.company_id = get_user_company_id()
  ))
);

CREATE POLICY "Company owners can manage stages" 
ON public.trail_stages FOR ALL 
USING (
  (trail_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.trails t 
    WHERE t.id = trail_stages.trail_id 
    AND t.company_id = get_user_company_id() 
    AND is_company_owner()
  )) OR
  (template_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.trail_templates tt 
    WHERE tt.id = trail_stages.template_id 
    AND tt.company_id = get_user_company_id() 
    AND is_company_owner()
  ))
);

-- RLS Policies for trail fields
CREATE POLICY "Users can view fields of accessible stages" 
ON public.trail_fields FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.trail_stages ts 
  WHERE ts.id = trail_fields.stage_id 
  AND (
    (ts.trail_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.trails t 
      WHERE t.id = ts.trail_id 
      AND t.company_id = get_user_company_id() 
      AND (t.user_id = auth.uid() OR is_company_owner())
    )) OR
    (ts.template_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.trail_templates tt 
      WHERE tt.id = ts.template_id 
      AND tt.company_id = get_user_company_id()
    ))
  )
));

CREATE POLICY "Company owners can manage fields" 
ON public.trail_fields FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.trail_stages ts 
  WHERE ts.id = trail_fields.stage_id 
  AND (
    (ts.trail_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.trails t 
      WHERE t.id = ts.trail_id 
      AND t.company_id = get_user_company_id() 
      AND is_company_owner()
    )) OR
    (ts.template_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.trail_templates tt 
      WHERE tt.id = ts.template_id 
      AND tt.company_id = get_user_company_id() 
      AND is_company_owner()
    ))
  )
));

-- RLS Policies for trail responses
CREATE POLICY "Users can manage their own responses" 
ON public.trail_responses FOR ALL 
USING (company_id = get_user_company_id() AND user_id = auth.uid())
WITH CHECK (company_id = get_user_company_id() AND user_id = auth.uid());

CREATE POLICY "Company owners can view all responses" 
ON public.trail_responses FOR SELECT 
USING (company_id = get_user_company_id() AND is_company_owner());

-- RLS Policies for trail progress
CREATE POLICY "Users can view their own progress" 
ON public.trail_progress FOR SELECT 
USING (company_id = get_user_company_id() AND user_id = auth.uid());

CREATE POLICY "Company owners can view all progress" 
ON public.trail_progress FOR SELECT 
USING (company_id = get_user_company_id() AND is_company_owner());

CREATE POLICY "System can manage progress" 
ON public.trail_progress FOR ALL 
USING (company_id = get_user_company_id())
WITH CHECK (company_id = get_user_company_id());

-- RLS Policies for trail badges
CREATE POLICY "Company owners can manage badges" 
ON public.trail_badges FOR ALL 
USING (company_id = get_user_company_id() AND is_company_owner())
WITH CHECK (company_id = get_user_company_id() AND is_company_owner() AND created_by = auth.uid());

CREATE POLICY "Users can view active badges" 
ON public.trail_badges FOR SELECT 
USING (company_id = get_user_company_id() AND is_active = true);

-- RLS Policies for user trail badges
CREATE POLICY "Users can view their own earned badges" 
ON public.user_trail_badges FOR SELECT 
USING (company_id = get_user_company_id() AND user_id = auth.uid());

CREATE POLICY "Company owners can view all earned badges" 
ON public.user_trail_badges FOR SELECT 
USING (company_id = get_user_company_id() AND is_company_owner());

CREATE POLICY "System can award badges" 
ON public.user_trail_badges FOR INSERT 
WITH CHECK (company_id = get_user_company_id());

-- Triggers for updating timestamps
CREATE TRIGGER update_trails_updated_at
BEFORE UPDATE ON public.trails
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trail_templates_updated_at
BEFORE UPDATE ON public.trail_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trail_stages_updated_at
BEFORE UPDATE ON public.trail_stages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trail_fields_updated_at
BEFORE UPDATE ON public.trail_fields
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trail_responses_updated_at
BEFORE UPDATE ON public.trail_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trail_progress_updated_at
BEFORE UPDATE ON public.trail_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate trail progress
CREATE OR REPLACE FUNCTION public.calculate_trail_progress(p_trail_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  total_stages INTEGER;
  completed_stages INTEGER;
  progress_percentage INTEGER;
BEGIN
  -- Count total stages
  SELECT COUNT(*) INTO total_stages
  FROM public.trail_stages
  WHERE trail_id = p_trail_id;
  
  -- Count completed stages
  SELECT COUNT(*) INTO completed_stages
  FROM public.trail_progress
  WHERE trail_id = p_trail_id AND is_completed = true;
  
  -- Calculate percentage
  IF total_stages > 0 THEN
    progress_percentage := ROUND((completed_stages::DECIMAL / total_stages::DECIMAL) * 100);
  ELSE
    progress_percentage := 0;
  END IF;
  
  -- Update trail progress
  UPDATE public.trails 
  SET progress_percentage = progress_percentage,
      updated_at = now()
  WHERE id = p_trail_id;
  
  RETURN progress_percentage;
END;
$$;

-- Function to award trail badge and coins
CREATE OR REPLACE FUNCTION public.award_trail_badge(
  p_user_id UUID,
  p_company_id UUID,
  p_trail_id UUID,
  p_badge_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  badge_record RECORD;
BEGIN
  -- Get badge details
  SELECT * INTO badge_record
  FROM public.trail_badges
  WHERE company_id = p_company_id 
  AND badge_type = p_badge_type 
  AND is_active = true
  LIMIT 1;
  
  IF badge_record.id IS NOT NULL THEN
    -- Award badge (ignore if already earned)
    INSERT INTO public.user_trail_badges (user_id, company_id, trail_id, badge_id)
    VALUES (p_user_id, p_company_id, p_trail_id, badge_record.id)
    ON CONFLICT (user_id, trail_id, badge_id) DO NOTHING;
    
    -- Award coins if configured
    IF badge_record.coins_reward > 0 THEN
      PERFORM public.add_user_coins(p_user_id, p_company_id, 'trail_badge', badge_record.id);
      
      -- Insert custom transaction with badge reward amount
      INSERT INTO public.point_transactions (user_id, company_id, action_type, points, coins, reference_id)
      VALUES (p_user_id, p_company_id, 'trail_badge', badge_record.coins_reward, badge_record.coins_reward, badge_record.id);
      
      -- Update user's total coins
      INSERT INTO public.user_points (user_id, company_id, total_coins)
      VALUES (p_user_id, p_company_id, badge_record.coins_reward)
      ON CONFLICT (user_id, company_id)
      DO UPDATE SET 
        total_coins = user_points.total_coins + badge_record.coins_reward,
        updated_at = now();
    END IF;
    
    -- Create notification
    INSERT INTO public.notifications (user_id, company_id, type, title, content, reference_id)
    VALUES (
      p_user_id,
      p_company_id,
      'trail_badge',
      'Novo Selo Conquistado!',
      'Parabéns! Você conquistou o selo "' || badge_record.name || '" em sua jornada.',
      badge_record.id
    );
  END IF;
END;
$$;

-- Insert default trail badges
INSERT INTO public.trail_badges (company_id, name, description, icon_name, color, badge_type, coins_reward, created_by)
SELECT 
  c.id,
  badge.name,
  badge.description,
  badge.icon_name,
  badge.color,
  badge.badge_type,
  badge.coins_reward,
  (SELECT user_id FROM public.profiles WHERE company_id = c.id AND role = 'owner' LIMIT 1)
FROM public.companies c
CROSS JOIN (
  VALUES 
    ('Desperta', 'Selo para quem inicia sua jornada de autoconhecimento', 'Sunrise', '#F59E0B', 'desperta', 25),
    ('Decidida', 'Selo para quem toma decisões importantes em sua vida', 'Target', '#8B5CF6', 'decidida', 50),
    ('Corajosa', 'Selo para quem enfrenta seus medos e desafios', 'Shield', '#EF4444', 'corajosa', 75),
    ('Em Movimento', 'Selo para quem está ativamente trabalhando em seus objetivos', 'Zap', '#10B981', 'em_movimento', 100),
    ('Celebrante', 'Selo para quem celebra suas conquistas e marcos', 'Star', '#F59E0B', 'celebrante', 150)
) AS badge(name, description, icon_name, color, badge_type, coins_reward)
WHERE NOT EXISTS (
  SELECT 1 FROM public.trail_badges tb 
  WHERE tb.company_id = c.id AND tb.badge_type = badge.badge_type
);