-- Create RPC function to count company users with filters
CREATE OR REPLACE FUNCTION public.get_company_users_count_with_filters(
  p_company_id uuid,
  p_search text,
  p_roles text[],
  p_tag_ids text[],
  p_joined_start text,
  p_joined_end text,
  p_course_ids text[],
  p_level_ids text[],
  p_badge_ids text[]
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
begin
  -- 1) Permissão: somente owner/admin da empresa
  if not exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.company_id = p_company_id
      and p.role in ('owner','admin')
      and p.is_active = true
  ) then
    raise exception 'Access denied: Only company owners and admins can access this function';
  end if;

  -- 2) Consulta de contagem usando a mesma lógica de filtros da função principal
  return (
    with user_tags as (
      select
        ut.user_id,
        array_agg(ut.tag_id::text) as tag_ids
      from public.user_tags ut
      join public.tags t on t.id = ut.tag_id
      where ut.company_id = p_company_id
      group by ut.user_id
    ),
    user_badges as (
      select
        ub.user_id,
        array_agg(ub.badge_id::text) as badge_ids
      from public.user_trail_badges ub
      join public.trail_badges tb on tb.id = ub.badge_id
      where ub.company_id = p_company_id
      group by ub.user_id
    )
    select count(*)::integer
    from public.profiles p
    left join user_tags ut on ut.user_id = p.user_id
    left join user_badges ub on ub.user_id = p.user_id
    left join public.user_current_level ucl
           on ucl.user_id = p.user_id and ucl.company_id = p.company_id
    where
      p.company_id = p_company_id
      and p.is_active = true

      -- busca simples
      and (
        p_search is null or
        p.first_name ilike ('%' || p_search || '%') or
        p.last_name  ilike ('%' || p_search || '%') or
        p.email      ilike ('%' || p_search || '%')
      )

      -- filtro por roles
      and (
        p_roles is null or p.role = any(p_roles)
      )

      -- filtro por tags (overlap de arrays)
      and (
        p_tag_ids is null or ut.tag_ids && p_tag_ids
      )

      -- joined_at entre datas (strings -> timestamptz)
      and (
        p_joined_start is null or p.created_at >= (p_joined_start::timestamptz)
      )
      and (
        p_joined_end   is null or p.created_at <= (p_joined_end::timestamptz)
      )

      -- filtro por level ids
      and (
        p_level_ids is null or (ucl.current_level_id::text = any(p_level_ids))
      )

      -- filtro por badges (overlap)
      and (
        p_badge_ids is null or ub.badge_ids && p_badge_ids
      )
  );
end;
$function$