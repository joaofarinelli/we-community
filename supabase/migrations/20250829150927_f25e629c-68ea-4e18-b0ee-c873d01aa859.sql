-- 1) Função de debug do contexto atual
CREATE OR REPLACE FUNCTION public.debug_current_company_context()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  headers jsonb;
  x_company_id text;
  app_ctx text;
  uid uuid;
  user_companies jsonb;
BEGIN
  uid := auth.uid();
  headers := NULL;
  BEGIN
    headers := current_setting('request.headers', true)::jsonb;
  EXCEPTION WHEN others THEN
    headers := '{}'::jsonb;
  END;

  x_company_id := COALESCE(headers ->> 'x-company-id', NULL);
  app_ctx := NULLIF(current_setting('app.current_company_id', true), '');

  SELECT jsonb_agg(jsonb_build_object('company_id', p.company_id, 'is_active', p.is_active, 'created_at', p.created_at))
  INTO user_companies
  FROM public.profiles p
  WHERE p.user_id = uid;

  RETURN jsonb_build_object(
    'uid', uid,
    'x_company_id_header', x_company_id,
    'host', headers ->> 'host',
    'app_current_company_id', app_ctx,
    'get_user_company_id', public.get_user_company_id(),
    'user_companies', COALESCE(user_companies, '[]'::jsonb)
  );
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.debug_current_company_context() TO authenticated, anon;

-- 2) RPC para criar espaço com validações e contexto consistente
CREATE OR REPLACE FUNCTION public.create_space_with_context(
  p_company_id uuid,
  p_category_id uuid,
  p_name text,
  p_description text DEFAULT NULL,
  p_visibility text DEFAULT 'public',
  p_type text DEFAULT 'discussion'
)
RETURNS public.spaces
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_uid uuid := auth.uid();
  v_next_order integer := 0;
  v_new_space public.spaces%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Usuário precisa ter perfil ativo nesta empresa
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.user_id = v_uid
      AND pr.company_id = p_company_id
      AND pr.is_active = true
  ) THEN
    RAISE EXCEPTION 'Usuário não possui perfil ativo na empresa informada';
  END IF;

  -- Categoria precisa pertencer à mesma empresa
  IF NOT EXISTS (
    SELECT 1 FROM public.space_categories sc
    WHERE sc.id = p_category_id
      AND sc.company_id = p_company_id
  ) THEN
    RAISE EXCEPTION 'Categoria inválida para a empresa';
  END IF;

  -- Próximo order_index
  SELECT COALESCE(MAX(order_index) + 1, 0)
  INTO v_next_order
  FROM public.spaces
  WHERE company_id = p_company_id
    AND category_id = p_category_id;

  -- Inserir espaço
  INSERT INTO public.spaces (
    id,
    category_id,
    company_id,
    name,
    description,
    type,
    order_index,
    created_by,
    visibility,
    custom_icon_type,
    custom_icon_value
  ) VALUES (
    gen_random_uuid(),
    p_category_id,
    p_company_id,
    p_name,
    NULLIF(p_description, ''),
    COALESCE(p_type, 'discussion'),
    v_next_order,
    v_uid,
    COALESCE(p_visibility, 'public'),
    'default',
    NULL
  )
  RETURNING * INTO v_new_space;

  -- Garantir criador como admin do espaço (com company_id)
  INSERT INTO public.space_members (space_id, user_id, company_id, role)
  VALUES (v_new_space.id, v_uid, p_company_id, 'admin')
  ON CONFLICT DO NOTHING;

  RETURN v_new_space;
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.create_space_with_context(uuid, uuid, text, text, text, text) TO authenticated, anon;