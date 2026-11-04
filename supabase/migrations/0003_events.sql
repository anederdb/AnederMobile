-- Events and announcements: approved members read, admins write.
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  cover_url text,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index events_starts_at_idx on public.events (starts_at);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  cover_url text,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index announcements_created_at_idx on public.announcements (created_at desc);

alter table public.events enable row level security;
alter table public.announcements enable row level security;

create policy events_select on public.events for select to authenticated using (public.is_approved());
create policy events_admin_insert on public.events for insert to authenticated with check (public.is_admin());
create policy events_admin_update on public.events for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy events_admin_delete on public.events for delete to authenticated using (public.is_admin());

create policy announcements_select on public.announcements for select to authenticated using (public.is_approved());
create policy announcements_admin_insert on public.announcements for insert to authenticated with check (public.is_admin());
create policy announcements_admin_update on public.announcements for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy announcements_admin_delete on public.announcements for delete to authenticated using (public.is_admin());
