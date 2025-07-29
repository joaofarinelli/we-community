-- Create event_likes table for event like functionality
CREATE TABLE public.event_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.event_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for event_likes
CREATE POLICY "Users can like events in accessible spaces"
ON public.event_likes
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id() 
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_likes.event_id
    AND can_user_see_space(e.space_id, auth.uid())
  )
);

CREATE POLICY "Users can remove their own likes"
ON public.event_likes
FOR DELETE
USING (
  company_id = get_user_company_id() 
  AND user_id = auth.uid()
);

CREATE POLICY "Users can view likes on accessible events"
ON public.event_likes
FOR SELECT
USING (
  company_id = get_user_company_id()
  AND EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_likes.event_id
    AND can_user_see_space(e.space_id, auth.uid())
  )
);

-- Create index for performance
CREATE INDEX idx_event_likes_event_id ON public.event_likes(event_id);
CREATE INDEX idx_event_likes_user_id ON public.event_likes(user_id);