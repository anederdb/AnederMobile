-- Profile photos. New signups must add one (photo_required); members who joined before stay optional.
-- Files live in a public bucket under <user id>/..., and each user can only write inside their own folder.
alter table public.profiles add column photo_required boolean not null default false;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, phone, terms_accepted_at, email_consent, photo_required)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    case when (new.raw_user_meta_data ->> 'terms_accepted') = 'true' then now() end,
    coalesce((new.raw_user_meta_data ->> 'email_consent') = 'true', false),
    true
  );
  return new;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy avatars_own_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_own_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
