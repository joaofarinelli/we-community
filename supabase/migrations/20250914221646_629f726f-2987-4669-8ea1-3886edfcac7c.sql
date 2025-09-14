-- Create course-thumbnails bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('course-thumbnails', 'course-thumbnails', true)
on conflict (id) do nothing;

-- Policies for public read access
create policy "Course thumbnails are publicly accessible"
  on storage.objects
  for select
  using (bucket_id = 'course-thumbnails');

-- Policies to allow authenticated company admins to manage files
create policy "Admins can upload course thumbnails"
  on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'course-thumbnails'
    and public.is_company_admin()
  );

create policy "Admins can update course thumbnails"
  on storage.objects
  for update to authenticated
  using (
    bucket_id = 'course-thumbnails'
    and public.is_company_admin()
  )
  with check (
    bucket_id = 'course-thumbnails'
    and public.is_company_admin()
  );

create policy "Admins can delete course thumbnails"
  on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'course-thumbnails'
    and public.is_company_admin()
  );