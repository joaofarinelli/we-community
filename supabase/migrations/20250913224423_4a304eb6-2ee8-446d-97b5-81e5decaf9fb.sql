-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enums
CREATE TYPE public.user_role AS ENUM ('owner', 'admin', 'moderator', 'user');
CREATE TYPE public.post_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.space_visibility AS ENUM ('public', 'private', 'restricted');
CREATE TYPE public.event_status AS ENUM ('draft', 'active', 'completed', 'cancelled');
CREATE TYPE public.moderation_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE public.challenge_type AS ENUM ('individual', 'team', 'company_wide');

-- 1. CORE TABLES
-- Companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT UNIQUE,
  custom_domain TEXT UNIQUE,
  domain_verified BOOLEAN DEFAULT false,
  custom_domain_verified BOOLEAN DEFAULT false,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#10B981',
  coin_name TEXT DEFAULT 'WomanCoins',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Company settings
CREATE TABLE public.company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  gamification_enabled BOOLEAN DEFAULT true,
  courses_enabled BOOLEAN DEFAULT true,
  marketplace_enabled BOOLEAN DEFAULT true,
  trails_enabled BOOLEAN DEFAULT true,
  onboarding_required BOOLEAN DEFAULT false,
  maintenance_mode BOOLEAN DEFAULT false,
  maintenance_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id)
);

-- Profiles table (links to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  department TEXT,
  position TEXT,
  bio TEXT,
  role public.user_role DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, company_id),
  UNIQUE(email, company_id)
);

-- User sessions
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Login attempts
CREATE TABLE public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  ip_address INET,
  success BOOLEAN DEFAULT false,
  attempt_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CONTENT SYSTEM
-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Spaces
CREATE TABLE public.spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  visibility public.space_visibility DEFAULT 'public',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Space members
CREATE TABLE public.space_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(space_id, user_id)
);

-- Posts
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image_url TEXT,
  status public.post_status DEFAULT 'published',
  is_pinned BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Post reactions
CREATE TABLE public.post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- Post comments
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. COURSES AND EDUCATION
-- Courses
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  instructor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_minutes INTEGER DEFAULT 0,
  difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  is_published BOOLEAN DEFAULT false,
  price DECIMAL(10,2) DEFAULT 0,
  points_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Course lessons
CREATE TABLE public.course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  video_url TEXT,
  duration_minutes INTEGER DEFAULT 0,
  order_index INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(course_id, order_index)
);

-- Course enrollments
CREATE TABLE public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  UNIQUE(course_id, user_id)
);

-- Lesson progress
CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  time_spent_minutes INTEGER DEFAULT 0,
  UNIQUE(enrollment_id, lesson_id)
);

-- Quizzes
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  max_attempts INTEGER,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Quiz questions
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'essay', 'fill_blank')),
  points INTEGER DEFAULT 1,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(quiz_id, order_index)
);

-- Quiz question options
CREATE TABLE public.quiz_question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL,
  UNIQUE(question_id, order_index)
);

-- Quiz attempts
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  time_taken_minutes INTEGER DEFAULT 0
);

-- Quiz answers
CREATE TABLE public.quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES public.quiz_question_options(id) ON DELETE CASCADE,
  answer_text TEXT,
  is_correct BOOLEAN DEFAULT false,
  points_awarded INTEGER DEFAULT 0,
  UNIQUE(attempt_id, question_id)
);

-- Certificate templates
CREATE TABLE public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_html TEXT NOT NULL,
  background_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Certificates
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.certificate_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  trail_id UUID, -- Will be linked later
  certificate_number TEXT UNIQUE NOT NULL,
  recipient_name TEXT NOT NULL,
  issued_date DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  verification_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TRAILS SYSTEM
-- Trails
CREATE TABLE public.trails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  estimated_duration_days INTEGER DEFAULT 30,
  difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  points_reward INTEGER DEFAULT 0,
  badge_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key for certificates
ALTER TABLE public.certificates ADD COLUMN trail_id UUID REFERENCES public.trails(id) ON DELETE CASCADE;

-- Trail steps
CREATE TABLE public.trail_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trail_id UUID NOT NULL REFERENCES public.trails(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  step_type TEXT DEFAULT 'course' CHECK (step_type IN ('course', 'quiz', 'assignment', 'reading')),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  content_url TEXT,
  points_reward INTEGER DEFAULT 0,
  order_index INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(trail_id, order_index)
);

-- Trail enrollments
CREATE TABLE public.trail_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trail_id UUID NOT NULL REFERENCES public.trails(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  UNIQUE(trail_id, user_id)
);

-- Trail progress
CREATE TABLE public.trail_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.trail_enrollments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.trail_steps(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  points_earned INTEGER DEFAULT 0,
  UNIQUE(enrollment_id, step_id)
);

-- Trail badges
CREATE TABLE public.trail_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trail_id UUID NOT NULL REFERENCES public.trails(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(trail_id, user_id)
);

-- 5. MARKETPLACE AND STORE
-- Marketplace categories
CREATE TABLE public.marketplace_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Marketplace items
CREATE TABLE public.marketplace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.marketplace_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price_coins INTEGER NOT NULL CHECK (price_coins >= 0),
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Marketplace orders
CREATE TABLE public.marketplace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_coins INTEGER NOT NULL CHECK (total_coins >= 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'delivered', 'cancelled')),
  notes TEXT,
  ordered_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ
);

-- TMB Products
CREATE TABLE public.tmb_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  tmb_product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  sync_enabled BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, tmb_product_id)
);

-- Store items (internal products)
CREATE TABLE public.store_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  stock_quantity INTEGER DEFAULT 0,
  is_digital BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. GAMIFICATION SYSTEM
-- User levels
CREATE TABLE public.user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  level_number INTEGER NOT NULL CHECK (level_number > 0),
  title TEXT NOT NULL,
  description TEXT,
  min_points INTEGER NOT NULL CHECK (min_points >= 0),
  max_points INTEGER CHECK (max_points > min_points OR max_points IS NULL),
  badge_url TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, level_number),
  UNIQUE(company_id, min_points)
);

-- User points
CREATE TABLE public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_coins INTEGER DEFAULT 0 CHECK (total_coins >= 0),
  available_coins INTEGER DEFAULT 0 CHECK (available_coins >= 0),
  lifetime_coins INTEGER DEFAULT 0 CHECK (lifetime_coins >= 0),
  current_level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Activity logs
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT,
  points_earned INTEGER DEFAULT 0,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Challenges
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type public.challenge_type DEFAULT 'individual',
  points_reward INTEGER DEFAULT 0,
  badge_url TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Challenge submissions
CREATE TABLE public.challenge_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_content TEXT,
  submission_url TEXT,
  points_earned INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- 7. EVENTS SYSTEM
-- Events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  max_participants INTEGER,
  registration_deadline TIMESTAMPTZ,
  status public.event_status DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (end_date > start_date)
);

-- Event participants
CREATE TABLE public.event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'cancelled', 'attended')),
  registered_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- 8. SEGMENTATION AND GROUPS
-- Segments
CREATE TABLE public.segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, name)
);

-- User segments
CREATE TABLE public.user_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES public.segments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(segment_id, user_id)
);

-- Access groups
CREATE TABLE public.access_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Access group members
CREATE TABLE public.access_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.access_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Access permissions
CREATE TABLE public.access_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.access_groups(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  permission_type TEXT NOT NULL CHECK (permission_type IN ('read', 'write', 'delete', 'admin')),
  granted_at TIMESTAMPTZ DEFAULT now()
);

-- 9. CUSTOMIZATION AND CONFIGURATION
-- Profile fields
CREATE TABLE public.profile_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'email', 'phone', 'date', 'select', 'multiselect', 'boolean')),
  field_options JSONB,
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, field_name),
  UNIQUE(company_id, order_index)
);

-- User profile data
CREATE TABLE public.user_profile_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.profile_fields(id) ON DELETE CASCADE,
  field_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, company_id, field_id)
);

-- Tags
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Onboarding steps
CREATE TABLE public.onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  step_type TEXT DEFAULT 'info' CHECK (step_type IN ('info', 'form', 'video', 'quiz')),
  is_required BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, order_index)
);

-- User onboarding progress
CREATE TABLE public.user_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.onboarding_steps(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, company_id, step_id)
);

-- 10. OPERATIONS AND COMMUNICATION
-- Moderation queue
CREATE TABLE public.moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  status public.moderation_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bulk actions
CREATE TABLE public.bulk_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_ids UUID[] NOT NULL,
  parameters JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT DEFAULT 'info' CHECK (notification_type IN ('info', 'success', 'warning', 'error')),
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Announcements
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  announcement_type TEXT DEFAULT 'general' CHECK (announcement_type IN ('general', 'maintenance', 'feature', 'event')),
  target_audience JSONB, -- Criteria for who should see this
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ DEFAULT now(),
  end_date TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payments and transactions
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  payment_method TEXT,
  external_payment_id TEXT,
  status public.payment_status DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Payment transactions
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('charge', 'refund', 'chargeback')),
  amount DECIMAL(10,2) NOT NULL,
  external_transaction_id TEXT,
  processed_at TIMESTAMPTZ DEFAULT now()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON public.company_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_spaces_updated_at BEFORE UPDATE ON public.spaces FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_course_lessons_updated_at BEFORE UPDATE ON public.course_lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_certificate_templates_updated_at BEFORE UPDATE ON public.certificate_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trails_updated_at BEFORE UPDATE ON public.trails FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_marketplace_items_updated_at BEFORE UPDATE ON public.marketplace_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tmb_products_updated_at BEFORE UPDATE ON public.tmb_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_store_items_updated_at BEFORE UPDATE ON public.store_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_points_updated_at BEFORE UPDATE ON public.user_points FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON public.challenges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_segments_updated_at BEFORE UPDATE ON public.segments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_profile_data_updated_at BEFORE UPDATE ON public.user_profile_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_company ON public.profiles(user_id, company_id);
CREATE INDEX idx_profiles_company_email ON public.profiles(company_id, email);
CREATE INDEX idx_profiles_company_active ON public.profiles(company_id, is_active);
CREATE INDEX idx_posts_company_space ON public.posts(company_id, space_id);
CREATE INDEX idx_posts_status_created ON public.posts(status, created_at DESC);
CREATE INDEX idx_course_enrollments_user ON public.course_enrollments(user_id, course_id);
CREATE INDEX idx_trail_enrollments_user ON public.trail_enrollments(user_id, trail_id);
CREATE INDEX idx_user_points_company_user ON public.user_points(company_id, user_id);
CREATE INDEX idx_activity_logs_user_date ON public.activity_logs(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_events_company_date ON public.events(company_id, start_date);

-- Enable Row Level Security on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trail_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trail_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trail_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trail_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tmb_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profile_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;