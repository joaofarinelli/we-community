-- Create lesson_materials table for downloadable files
CREATE TABLE public.lesson_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lesson_materials ENABLE ROW LEVEL SECURITY;

-- Create policies for lesson materials
CREATE POLICY "Users can view materials for lessons they have access to" 
ON public.lesson_materials 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM course_lessons cl 
  JOIN course_modules cm ON cm.id = cl.module_id 
  JOIN courses c ON c.id = cm.course_id 
  WHERE cl.id = lesson_materials.lesson_id 
  AND c.company_id = get_user_company_id() 
  AND c.is_active = true
));

CREATE POLICY "Company owners can manage lesson materials" 
ON public.lesson_materials 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM course_lessons cl 
  JOIN course_modules cm ON cm.id = cl.module_id 
  JOIN courses c ON c.id = cm.course_id 
  WHERE cl.id = lesson_materials.lesson_id 
  AND c.company_id = get_user_company_id() 
  AND is_company_owner()
));

-- Create lesson_notes table for user personal notes
CREATE TABLE public.lesson_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  timestamp_seconds INTEGER, -- for video timestamp notes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for lesson notes
CREATE POLICY "Users can view their own notes" 
ON public.lesson_notes 
FOR SELECT 
USING (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM course_lessons cl 
  JOIN course_modules cm ON cm.id = cl.module_id 
  JOIN courses c ON c.id = cm.course_id 
  WHERE cl.id = lesson_notes.lesson_id 
  AND c.company_id = get_user_company_id() 
  AND c.is_active = true
));

CREATE POLICY "Users can create their own notes" 
ON public.lesson_notes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM course_lessons cl 
  JOIN course_modules cm ON cm.id = cl.module_id 
  JOIN courses c ON c.id = cm.course_id 
  WHERE cl.id = lesson_notes.lesson_id 
  AND c.company_id = get_user_company_id() 
  AND c.is_active = true
));

CREATE POLICY "Users can update their own notes" 
ON public.lesson_notes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
ON public.lesson_notes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_lesson_materials_updated_at
BEFORE UPDATE ON public.lesson_materials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lesson_notes_updated_at
BEFORE UPDATE ON public.lesson_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();