-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL,
  company_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  max_participants INTEGER,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event participants table
CREATE TABLE public.event_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for events
CREATE POLICY "Users can view events in accessible spaces" 
ON public.events FOR SELECT 
USING (
  company_id = get_user_company_id() AND 
  can_user_see_space(space_id, auth.uid())
);

CREATE POLICY "Space admins can create events" 
ON public.events FOR INSERT 
WITH CHECK (
  company_id = get_user_company_id() AND 
  auth.uid() = created_by AND
  (
    EXISTS (
      SELECT 1 FROM public.space_members sm 
      WHERE sm.space_id = events.space_id 
      AND sm.user_id = auth.uid() 
      AND sm.role = 'admin'
    ) OR is_company_owner()
  )
);

CREATE POLICY "Space admins can update events" 
ON public.events FOR UPDATE 
USING (
  company_id = get_user_company_id() AND
  (
    EXISTS (
      SELECT 1 FROM public.space_members sm 
      WHERE sm.space_id = events.space_id 
      AND sm.user_id = auth.uid() 
      AND sm.role = 'admin'
    ) OR is_company_owner()
  )
);

CREATE POLICY "Space admins can delete events" 
ON public.events FOR DELETE 
USING (
  company_id = get_user_company_id() AND
  (
    EXISTS (
      SELECT 1 FROM public.space_members sm 
      WHERE sm.space_id = events.space_id 
      AND sm.user_id = auth.uid() 
      AND sm.role = 'admin'
    ) OR is_company_owner()
  )
);

-- RLS policies for event participants
CREATE POLICY "Users can view participants in accessible events" 
ON public.event_participants FOR SELECT 
USING (
  company_id = get_user_company_id() AND
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = event_participants.event_id 
    AND can_user_see_space(e.space_id, auth.uid())
  )
);

CREATE POLICY "Users can join events in accessible spaces" 
ON public.event_participants FOR INSERT 
WITH CHECK (
  company_id = get_user_company_id() AND 
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = event_participants.event_id 
    AND can_user_see_space(e.space_id, auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.space_members sm 
      WHERE sm.space_id = e.space_id 
      AND sm.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can leave events" 
ON public.event_participants FOR DELETE 
USING (
  company_id = get_user_company_id() AND 
  user_id = auth.uid()
);

-- Create trigger for updating timestamps
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();