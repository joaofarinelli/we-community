
-- 1) Lista de usuários com filtros (nome/email, função, tags, data de entrada, acesso a cursos)
-- Retorna também tags agregadas, contagem de posts e nº de cursos com acesso
create or replace function public.get_company_users_with_filters(
  p_company_id uuid,
  p_search text default null,
  p_roles text[] default null,
  p_tag_ids uuid[] default null,
  p_joined_start date default null,
  p_joined_end date default null,
  p_course_ids uuid[] default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table(
  user_id uuid,
  first_name text,
  last_name text,
  email text,
  role text,
  joined_at timestamptz,
  tag_ids uuid[],
  tag_names text[],
  posts_count integer,
  courses_count integer
)
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  -- Permitir apenas owners/admins da empresa
  if not exists (
    select 1 from public.profiles
    where user_id = auth.uid()
      and company_id = p_company_id
      and role in ('owner','admin')
      and is_active = true
  ) then
    raise exception 'Access denied';
  end if;

  return query
  with base as (
    select
      p.user_id,
      p.first_name,
      p.last_name,
      p.email,
      p.role,
      p.created_at as joined_at
    from public.profiles p
    where p.company_id = p_company_id
      and p.is_active = true
      and (p_search is null
           or p.first_name ilike '%' || p_search || '%'
           or p.last_name  ilike '%' || p_search || '%'
           or p.email      ilike '%' || p_search || '%')
      and (p_roles is null or array_length(p_roles,1) is null or p.role = any(p_roles))
      and (p_joined_start is null or p.created_at >= p_joined_start::timestamptz)
      and (p_joined_end   is null or p.created_at < (p_joined_end + 1))
      and (
        p_tag_ids is null or array_length(p_tag_ids,1) is null
        or exists (
          select 1
          from public.user_tags ut
          where ut.user_id = p.user_id
            and ut.company_id = p_company_id
            and ut.tag_id = any(p_tag_ids)
        )
      )
      and (
        p_course_ids is null or array_length(p_course_ids,1) is null
        or exists (
          select 1
          from public.user_course_access uca
          where uca.user_id = p.user_id
            and uca.company_id = p_company_id
            and uca.course_id = any(p_course_ids)
        )
      )
    order by p.created_at desc
    limit coalesce(p_limit, 20)
    offset coalesce(p_offset, 0)
  ),
  tags as (
    select
      b.user_id,
      coalesce(array_agg(t.id order by t.name) filter (where t.id is not null), array[]::uuid[]) as tag_ids,
      coalesce(array_agg(t.name order by t.name) filter (where t.id is not null), array[]::text[]) as tag_names
    from base b
    left join public.user_tags ut
      on ut.user_id = b.user_id and ut.company_id = p_company_id
    left join public.tags t
      on t.id = ut.tag_id
    group by b.user_id
  ),
  posts as (
    select
      b.user_id,
      count(po.*)::int as posts_count
    from base b
    left join public.posts po
      on po.author_id = b.user_id and po.company_id = p_company_id
    group by b.user_id
  ),
  courses as (
    select
      b.user_id,
      count(distinct uca.course_id)::int as courses_count
    from base b
    left join public.user_course_access uca
      on uca.user_id = b.user_id and uca.company_id = p_company_id
    group by b.user_id
  )
  select
    b.user_id,
    b.first_name,
    b.last_name,
    b.email,
    b.role,
    b.joined_at,
    t.tag_ids,
    t.tag_names,
    coalesce(p.posts_count, 0) as posts_count,
    coalesce(c.courses_count, 0) as courses_count
  from base b
  left join tags   t on t.user_id = b.user_id
  left join posts  p on p.user_id  = b.user_id
  left join courses c on c.user_id = b.user_id;
end;
$$;

-- 2) Resumo de progresso do usuário por curso (apenas cursos acessíveis)
create or replace function public.get_user_course_progress_summary(
  p_user_id uuid,
  p_company_id uuid
)
returns table(
  course_id uuid,
  course_title text,
  total_lessons int,
  completed_lessons int,
  progress_percent numeric,
  is_completed boolean,
  certificate_issued boolean,
  certificate_code text,
  certificate_issued_at timestamptz
)
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not exists (
    select 1 from public.profiles
    where user_id = auth.uid()
      and company_id = p_company_id
      and role in ('owner','admin')
      and is_active = true
  ) then
    raise exception 'Access denied';
  end if;

  return query
  with accessible as (
    select c.id, c.title
    from public.courses c
    where c.company_id = p_company_id
      and c.is_active = true
      and public.user_has_course_access(p_user_id, c.id)
  ),
  totals as (
    select cm.course_id, count(cl.id)::int as total_lessons
    from public.course_modules cm
    join public.course_lessons cl on cl.module_id = cm.id
    group by cm.course_id
  ),
  completed as (
    select ucp.course_id, count(distinct ucp.lesson_id)::int as completed_lessons
    from public.user_course_progress ucp
    where ucp.user_id = p_user_id
    group by ucp.course_id
  ),
  certs as (
    select ucc.course_id, true as certificate_issued, ucc.certificate_code, ucc.issued_at
    from public.user_course_certificates ucc
    where ucc.user_id = p_user_id
  )
  select
    a.id as course_id,
    a.title as course_title,
    coalesce(t.total_lessons, 0) as total_lessons,
    coalesce(c.completed_lessons, 0) as completed_lessons,
    case when coalesce(t.total_lessons, 0) > 0
         then round((coalesce(c.completed_lessons, 0)::numeric * 100) / t.total_lessons, 2)
         else 0 end as progress_percent,
    case when coalesce(t.total_lessons, 0) > 0 and coalesce(c.completed_lessons, 0) = t.total_lessons
         then true else false end as is_completed,
    coalesce(ct.certificate_issued, false) as certificate_issued,
    ct.certificate_code,
    ct.issued_at as certificate_issued_at
  from accessible a
  left join totals t on t.course_id = a.id
  left join completed c on c.course_id = a.id
  left join certs ct on ct.course_id = a.id
  order by a.title;
end;
$$;

-- 3) Visão Geral consolidada do usuário (perfil, tags, moedas, nível, nº de posts)
create or replace function public.get_user_overview(
  p_user_id uuid,
  p_company_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  result jsonb;
  profile_row record;
  posts_count int;
  total_coins int;
  monthly_coins int;
  level_name text;
  level_color text;
  level_number int;
  level_icon text;
  tag_list jsonb := '[]'::jsonb;
begin
  if not exists (
    select 1 from public.profiles
    where user_id = auth.uid()
      and company_id = p_company_id
      and role in ('owner','admin')
      and is_active = true
  ) then
    raise exception 'Access denied';
  end if;

  select p.* into profile_row
  from public.profiles p
  where p.user_id = p_user_id
    and p.company_id = p_company_id;

  select count(*)::int into posts_count
  from public.posts po
  where po.company_id = p_company_id
    and po.author_id = p_user_id;

  select up.total_coins, up.monthly_coins
  into total_coins, monthly_coins
  from public.user_points up
  where up.user_id = p_user_id
    and up.company_id = p_company_id;

  select ul.level_name, ul.level_color, ul.level_number, ul.level_icon
  into level_name, level_color, level_number, level_icon
  from public.user_current_level ucl
  join public.user_levels ul on ul.id = ucl.current_level_id
  where ucl.user_id = p_user_id
    and ucl.company_id = p_company_id;

  select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)), '[]'::jsonb)
  into tag_list
  from public.user_tags ut
  join public.tags t on t.id = ut.tag_id
  where ut.user_id = p_user_id
    and ut.company_id = p_company_id;

  result := jsonb_build_object(
    'profile', to_jsonb(profile_row),
    'posts_count', coalesce(posts_count, 0),
    'points', jsonb_build_object(
      'total_coins', coalesce(total_coins, 0),
      'monthly_coins', coalesce(monthly_coins, 0)
    ),
    'level', jsonb_build_object(
      'name', level_name,
      'color', level_color,
      'number', level_number,
      'icon', level_icon
    ),
    'tags', tag_list
  );

  return result;
end;
$$;
