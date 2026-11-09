-- Roles and titles. Permissions live in profiles.role; titles are display-only labels.
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('member', 'admin', 'scanner'));
alter table public.profiles add column title text check (title is null or char_length(title) <= 60);

-- Only admins may change role, status or title (requests with no JWT, e.g. dashboard or service role, are trusted)
create or replace function public.guard_profile_columns() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (new.role is distinct from old.role or new.status is distinct from old.status or new.title is distinct from old.title)
     and (select auth.uid()) is not null
     and not public.is_admin() then
    raise exception 'only admins can change role, status or title' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

-- Admins and scanners (both approved) may scan member QR codes.
create function public.can_scan() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and status = 'approved' and role in ('admin', 'scanner')
  );
$$;

revoke execute on function public.can_scan() from public, anon;
grant execute on function public.can_scan() to authenticated;
