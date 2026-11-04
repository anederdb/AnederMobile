-- Public bucket for event cover photos; only admins can write.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers', 'covers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy covers_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'covers' and public.is_admin());
create policy covers_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'covers' and public.is_admin());
create policy covers_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'covers' and public.is_admin());
