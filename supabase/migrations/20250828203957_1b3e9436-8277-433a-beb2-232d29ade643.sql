-- Criar tabela para comentários de eventos
CREATE TABLE public.event_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES event_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para comentários
CREATE POLICY "Users can view comments on accessible events" 
ON public.event_comments 
FOR SELECT 
USING ((company_id = get_user_company_id()) AND (EXISTS ( SELECT 1
   FROM events e
  WHERE ((e.id = event_comments.event_id) AND can_user_see_space(e.space_id, auth.uid())))));

CREATE POLICY "Users can create comments on accessible events" 
ON public.event_comments 
FOR INSERT 
WITH CHECK ((company_id = get_user_company_id()) AND (user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM events e
  WHERE ((e.id = event_comments.event_id) AND can_user_see_space(e.space_id, auth.uid())))));

CREATE POLICY "Users can update their own comments" 
ON public.event_comments 
FOR UPDATE 
USING ((company_id = get_user_company_id()) AND (user_id = auth.uid()));

CREATE POLICY "Users can delete their own comments" 
ON public.event_comments 
FOR DELETE 
USING ((company_id = get_user_company_id()) AND (user_id = auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_event_comments_updated_at
BEFORE UPDATE ON public.event_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_event_comments_event_id ON public.event_comments(event_id);
CREATE INDEX idx_event_comments_user_id ON public.event_comments(user_id);
CREATE INDEX idx_event_comments_parent_id ON public.event_comments(parent_comment_id);