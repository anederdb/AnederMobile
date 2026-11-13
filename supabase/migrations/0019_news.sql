-- Sektörden Haberler: industry news posted by admins, read by approved members.
-- The optional photo lives in the existing admin-write `covers` bucket.
create table public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  body text not null check (char_length(body) between 1 and 10000),
  image_url text,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index news_created_at_idx on public.news (created_at desc);

alter table public.news enable row level security;

create policy news_select on public.news for select to authenticated using (public.is_approved());
create policy news_admin_insert on public.news for insert to authenticated with check (public.is_admin());
create policy news_admin_update on public.news for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy news_admin_delete on public.news for delete to authenticated using (public.is_admin());
