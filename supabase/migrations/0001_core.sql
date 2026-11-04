-- Core: profiles (roles/status), firms, helper functions, RLS.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  role text not null default 'member' check (role in ('member', 'admin')),
  status text not null default 'pending' check (status in ('pending', 'approved')),
  created_at timestamptz not null default now()
);

create table public.firms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  district text,
  sahibinden_url text check (
    sahibinden_url is null
    or sahibinden_url ~* '^https://([a-z0-9-]+\.)?sahibinden\.com(/|$)'
  ),
  created_at timestamptz not null default now()
);
create index firms_owner_id_idx on public.firms (owner_id);

-- Helpers (security definer so policies can read profiles without recursion)
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and status = 'approved'
  );
$$;

create function public.is_approved() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and status = 'approved'
  );
$$;

revoke execute on function public.is_admin(), public.is_approved() from public, anon;
grant execute on function public.is_admin(), public.is_approved() to authenticated;

-- New auth user -> pending member profile
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only admins may change role/status (requests with no JWT, e.g. dashboard or service role, are trusted)
create function public.guard_profile_columns() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (new.role is distinct from old.role or new.status is distinct from old.status)
     and (select auth.uid()) is not null
     and not public.is_admin() then
    raise exception 'only admins can change role or status' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger guard_profile_columns
  before update on public.profiles
  for each row execute function public.guard_profile_columns();

-- RLS
alter table public.profiles enable row level security;
alter table public.firms enable row level security;

create policy profiles_select on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or public.is_admin()
    or (status = 'approved' and public.is_approved())
  );

create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy profiles_update_admin on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy firms_select on public.firms for select to authenticated
  using (
    owner_id = (select auth.uid())
    or public.is_admin()
    or (public.is_approved() and exists (
      select 1 from public.profiles p where p.id = owner_id and p.status = 'approved'
    ))
  );

create policy firms_insert on public.firms for insert to authenticated
  with check (owner_id = (select auth.uid()) and public.is_approved());

create policy firms_update on public.firms for update to authenticated
  using (owner_id = (select auth.uid()) or public.is_admin())
  with check (owner_id = (select auth.uid()) or public.is_admin());

create policy firms_delete on public.firms for delete to authenticated
  using (owner_id = (select auth.uid()) or public.is_admin());
