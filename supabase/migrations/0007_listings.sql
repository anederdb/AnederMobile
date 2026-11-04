-- Listings: visible to approved members only, managed by their owner (and admins).
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  firm_id uuid references public.firms (id) on delete set null,
  title text not null,
  type text not null check (type in ('satilik', 'kiralik')),
  district text,
  neighborhood text,
  -- Turkish-insensitive key; must match normalizeTr() in src/lib/listingFilters.ts
  neighborhood_norm text generated always as (
    lower(translate(coalesce(neighborhood, ''), 'İIıŞşĞğÜüÖöÇç', 'iiissgguuoocc'))
  ) stored,
  price numeric check (price is null or price >= 0),
  rooms text,
  area_m2 numeric check (area_m2 is null or area_m2 >= 0),
  description text,
  photos text[] not null default '{}' check (coalesce(array_length(photos, 1), 0) <= 8),
  created_at timestamptz not null default now()
);
create index listings_owner_id_idx on public.listings (owner_id);
create index listings_search_idx on public.listings (type, district, price);
create index listings_neighborhood_idx on public.listings (neighborhood_norm);

alter table public.listings enable row level security;

create policy listings_select on public.listings for select to authenticated
  using (public.is_approved());

create policy listings_insert on public.listings for insert to authenticated
  with check (
    owner_id = (select auth.uid()) and public.is_approved()
    and (firm_id is null or exists (select 1 from public.firms f where f.id = firm_id and f.owner_id = owner_id))
  );

create policy listings_update on public.listings for update to authenticated
  using (owner_id = (select auth.uid()) or public.is_admin())
  with check (
    (owner_id = (select auth.uid()) or public.is_admin())
    and (firm_id is null or exists (select 1 from public.firms f where f.id = firm_id and f.owner_id = owner_id))
  );

create policy listings_delete on public.listings for delete to authenticated
  using (owner_id = (select auth.uid()) or public.is_admin());

-- Similar listings: same type required; neighborhood +3, district +2, price within 20% +2,
-- same rooms +1, area within 20% +1; at least 3 points to qualify.
create function public.similar_listings(p_listing_id uuid, p_limit int default 5)
returns setof public.listings
language sql stable security invoker set search_path = '' as $$
  select l.*
  from public.listings l
  join public.listings s on s.id = p_listing_id
  cross join lateral (
    select
      (case when s.neighborhood_norm <> '' and l.neighborhood_norm = s.neighborhood_norm then 3 else 0 end)
      + (case when s.district is not null and l.district = s.district then 2 else 0 end)
      + (case when s.price is not null and l.price between s.price * 0.8 and s.price * 1.2 then 2 else 0 end)
      + (case when s.rooms is not null and l.rooms = s.rooms then 1 else 0 end)
      + (case when s.area_m2 is not null and l.area_m2 between s.area_m2 * 0.8 and s.area_m2 * 1.2 then 1 else 0 end)
      as score
  ) sc
  where l.id <> s.id and l.type = s.type and sc.score >= 3
  order by sc.score desc, l.created_at desc
  limit p_limit;
$$;

revoke execute on function public.similar_listings(uuid, int) from public, anon;
grant execute on function public.similar_listings(uuid, int) to authenticated;

-- Private photo bucket; files live under <owner id>/...
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy listing_photos_select on storage.objects for select to authenticated
  using (bucket_id = 'listing-photos' and public.is_approved());
create policy listing_photos_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'listing-photos' and public.is_approved()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy listing_photos_update on storage.objects for update to authenticated
  using (bucket_id = 'listing-photos' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin()));
create policy listing_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'listing-photos' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin()));
