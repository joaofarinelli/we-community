-- Adicionar campo layout_type na tabela spaces
ALTER TABLE public.spaces 
ADD COLUMN layout_type text DEFAULT 'feed' CHECK (layout_type IN ('feed', 'list', 'card'));