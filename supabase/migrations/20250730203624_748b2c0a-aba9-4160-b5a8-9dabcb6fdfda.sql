-- Create enum types for trails system
DO $$ BEGIN
    CREATE TYPE trail_status AS ENUM ('active', 'paused', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE field_type AS ENUM ('text', 'textarea', 'multiple_choice', 'scale', 'date', 'file_upload', 'task_status');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE response_status AS ENUM ('pending', 'completed', 'skipped');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create trails table (main journeys)
CREATE TABLE IF NOT EXISTS public.trails (
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
CREATE TABLE IF NOT EXISTS public.trail_templates (
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
CREATE TABLE IF NOT EXISTS public.trail_stages (
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
CREATE TABLE IF NOT EXISTS public.trail_fields (
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
CREATE TABLE IF NOT EXISTS public.trail_responses (
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
CREATE TABLE IF NOT EXISTS public.trail_progress (
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
CREATE TABLE IF NOT EXISTS public.trail_badges (
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
CREATE TABLE IF NOT EXISTS public.user_trail_badges (
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