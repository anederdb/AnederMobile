-- Üyelere Özel: sponsor offers entered by admins, read by approved members.
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  sponsor text not null,
  title text not null,
  description text,
  link text check (link is null or link ~* '^https?://'),
  valid_until date,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index offers_created_at_idx on public.offers (created_at desc);

alter table public.offers enable row level security;

create policy offers_select on public.offers for select to authenticated using (public.is_approved());
create policy offers_admin_insert on public.offers for insert to authenticated with check (public.is_admin());
create policy offers_admin_update on public.offers for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy offers_admin_delete on public.offers for delete to authenticated using (public.is_admin());
