
-- Atualiza a função para incluir company_id ao adicionar o criador como membro do espaço
CREATE OR REPLACE FUNCTION public.add_space_creator_as_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.space_members (space_id, user_id, company_id, role)
  VALUES (NEW.id, NEW.created_by, NEW.company_id, 'admin');
  RETURN NEW;
END;
$function$;
