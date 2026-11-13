-- Kurumsal content that admins edit inside the app.
-- site_pages: the long texts (Başkan Mesajı, Hakkımızda, Vizyon, Misyon). No row = the app shows its template text.
-- trainings: Eğitimler (title, optional video link, optional note).
create table public.site_pages (
  key text primary key check (key in ('baskan-mesaji', 'hakkimizda', 'vizyon', 'misyon')),
  body text not null check (char_length(body) between 1 and 20000),
  updated_at timestamptz not null default now()
);

create table public.trainings (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  video_url text check (video_url is null or video_url ~* '^https?://'),
  note text check (note is null or char_length(note) <= 5000),
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index trainings_order_idx on public.trainings (position, created_at desc);

alter table public.site_pages enable row level security;
alter table public.trainings enable row level security;

create policy site_pages_select on public.site_pages for select to authenticated using (public.is_approved());
create policy site_pages_admin_insert on public.site_pages for insert to authenticated with check (public.is_admin());
create policy site_pages_admin_update on public.site_pages for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy site_pages_admin_delete on public.site_pages for delete to authenticated using (public.is_admin());

create policy trainings_select on public.trainings for select to authenticated using (public.is_approved());
create policy trainings_admin_insert on public.trainings for insert to authenticated with check (public.is_admin());
create policy trainings_admin_update on public.trainings for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy trainings_admin_delete on public.trainings for delete to authenticated using (public.is_admin());
