
-- Corrigir função hide_post para usar a coluna "hidden_reason"
CREATE OR REPLACE FUNCTION public.hide_post(
  post_id uuid,
  hidden_by_user uuid,
  hide_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  post_author_id uuid;
  post_company_id uuid;
  is_company_owner boolean;
BEGIN
  -- Buscar dados do post
  SELECT author_id, company_id
    INTO post_author_id, post_company_id
  FROM public.posts
  WHERE id = post_id;

  IF post_author_id IS NULL THEN
    RAISE EXCEPTION 'Post not found';
  END IF;

  -- Verificar se usuário é owner/admin da empresa do post
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = hidden_by_user 
      AND company_id = post_company_id 
      AND role IN ('owner', 'admin')
  ) INTO is_company_owner;

  -- Permitir autor do post ou owner/admin
  IF hidden_by_user != post_author_id AND NOT is_company_owner THEN
    RAISE EXCEPTION 'Permission denied: Only post author or admin can hide posts';
  END IF;

  -- Ocultar post
  UPDATE public.posts
  SET 
    is_hidden = true,
    hidden_at = now(),
    hidden_by = hidden_by_user,
    hidden_reason = hide_post.hide_reason,
    updated_at = now()
  WHERE id = post_id;
END;
$function$;

-- Corrigir função unhide_post para limpar "hidden_reason"
CREATE OR REPLACE FUNCTION public.unhide_post(
  post_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  post_author_id uuid;
  post_company_id uuid;
  user_id uuid;
  is_company_owner boolean;
BEGIN
  user_id := auth.uid();

  -- Buscar dados do post
  SELECT author_id, company_id
    INTO post_author_id, post_company_id
  FROM public.posts
  WHERE id = post_id;

  IF post_author_id IS NULL THEN
    RAISE EXCEPTION 'Post not found';
  END IF;

  -- Verificar se usuário é owner/admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = unhide_post.user_id 
      AND company_id = post_company_id 
      AND role IN ('owner', 'admin')
  ) INTO is_company_owner;

  -- Permitir autor do post ou owner/admin
  IF user_id != post_author_id AND NOT is_company_owner THEN
    RAISE EXCEPTION 'Permission denied: Only post author or admin can unhide posts';
  END IF;

  -- Reexibir post
  UPDATE public.posts
  SET 
    is_hidden = false,
    hidden_at = NULL,
    hidden_by = NULL,
    hidden_reason = NULL,
    updated_at = now()
  WHERE id = post_id;
END;
$function$;
