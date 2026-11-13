-- Date of birth. Kept in its own table, NOT on profiles: profiles rows are readable by every approved member,
-- but a birth date may only be seen by the member themselves and by admins.
create table public.profile_private (
  member_id uuid primary key references public.profiles (id) on delete cascade,
  birth_date date
);

alter table public.profile_private enable row level security;

create policy profile_private_select on public.profile_private for select to authenticated
  using (member_id = (select auth.uid()) or public.is_admin());
create policy profile_private_insert on public.profile_private for insert to authenticated
  with check (member_id = (select auth.uid()));
create policy profile_private_update on public.profile_private for update to authenticated
  using (member_id = (select auth.uid())) with check (member_id = (select auth.uid()));

-- Signup: also store the birth date from the signup metadata. A missing or invalid value is ignored
-- (between 1900-01-01 and today); it must never make the signup fail.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_birth date;
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
  begin
    v_birth := (new.raw_user_meta_data ->> 'birth_date')::date;
  exception when others then
    v_birth := null;
  end;
  if v_birth is not null and v_birth between date '1900-01-01' and current_date then
    insert into public.profile_private (member_id, birth_date) values (new.id, v_birth);
  end if;
  return new;
end;
$$;
