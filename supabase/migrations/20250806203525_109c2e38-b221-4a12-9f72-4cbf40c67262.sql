-- Create banned_words table for storing prohibited words by company
CREATE TABLE public.banned_words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  word TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create moderation_reports table for auto-generated reports
CREATE TABLE public.moderation_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  post_id UUID,
  comment_id UUID,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment')),
  original_content TEXT NOT NULL,
  flagged_words TEXT[] NOT NULL,
  confidence_score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add moderation fields to posts table
ALTER TABLE public.posts 
ADD COLUMN is_restricted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN auto_flagged BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN flagged_reason TEXT,
ADD COLUMN flagged_at TIMESTAMP WITH TIME ZONE;

-- Add moderation fields to post_interactions table for comments
ALTER TABLE public.post_interactions 
ADD COLUMN is_restricted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN auto_flagged BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN flagged_reason TEXT,
ADD COLUMN flagged_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS on new tables
ALTER TABLE public.banned_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for banned_words
CREATE POLICY "Company owners can manage banned words" 
ON public.banned_words 
FOR ALL 
USING (company_id = get_user_company_id() AND is_company_owner())
WITH CHECK (company_id = get_user_company_id() AND is_company_owner() AND auth.uid() = created_by);

CREATE POLICY "Users can view banned words in their company" 
ON public.banned_words 
FOR SELECT 
USING (company_id = get_user_company_id());

-- Create policies for moderation_reports
CREATE POLICY "Company owners can manage moderation reports" 
ON public.moderation_reports 
FOR ALL 
USING (company_id = get_user_company_id() AND is_company_owner());

CREATE POLICY "System can create moderation reports" 
ON public.moderation_reports 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id());

-- Create function to update updated_at column
CREATE TRIGGER update_banned_words_updated_at
BEFORE UPDATE ON public.banned_words
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_moderation_reports_updated_at
BEFORE UPDATE ON public.moderation_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_banned_words_company_active ON public.banned_words(company_id, is_active);
CREATE INDEX idx_moderation_reports_company_status ON public.moderation_reports(company_id, status);
CREATE INDEX idx_posts_restricted ON public.posts(company_id, is_restricted) WHERE is_restricted = true;
CREATE INDEX idx_post_interactions_restricted ON public.post_interactions(post_id, is_restricted) WHERE is_restricted = true;