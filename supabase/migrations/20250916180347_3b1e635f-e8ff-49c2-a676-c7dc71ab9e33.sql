-- Create event materials table
CREATE TABLE public.event_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  is_visible_to_participants BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_materials ENABLE ROW LEVEL SECURITY;

-- Create policies for event materials
CREATE POLICY "Event admins can manage all materials"
ON public.event_materials
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_materials.event_id
    AND e.company_id = get_user_company_id()
    AND (
      is_company_admin()
      OR EXISTS (
        SELECT 1 FROM public.space_members sm
        WHERE sm.space_id = e.space_id
        AND sm.user_id = auth.uid()
        AND sm.role = 'admin'
      )
      OR e.created_by = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_materials.event_id
    AND e.company_id = get_user_company_id()
    AND (
      is_company_admin()
      OR EXISTS (
        SELECT 1 FROM public.space_members sm
        WHERE sm.space_id = e.space_id
        AND sm.user_id = auth.uid()
        AND sm.role = 'admin'
      )
      OR e.created_by = auth.uid()
    )
  )
  AND auth.uid() = uploaded_by
);

CREATE POLICY "Participants can view visible materials"
ON public.event_materials
FOR SELECT
USING (
  is_visible_to_participants = true
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_materials.event_id
    AND e.company_id = get_user_company_id()
    AND can_user_see_space(e.space_id, auth.uid())
  )
);

-- Create storage bucket for event materials
INSERT INTO storage.buckets (id, name, public) VALUES ('event-materials', 'event-materials', false);

-- Create storage policies
CREATE POLICY "Event admins can upload materials"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'event-materials'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.company_id = get_user_company_id()
    AND p.is_active = true
  )
);

CREATE POLICY "Event admins can manage their uploaded materials"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'event-materials'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Participants can view materials"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'event-materials'
  AND EXISTS (
    SELECT 1 FROM public.event_materials em
    JOIN public.events e ON e.id = em.event_id
    WHERE em.file_url LIKE '%' || name || '%'
    AND em.is_visible_to_participants = true
    AND e.company_id = get_user_company_id()
    AND can_user_see_space(e.space_id, auth.uid())
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_event_materials_updated_at
BEFORE UPDATE ON public.event_materials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();