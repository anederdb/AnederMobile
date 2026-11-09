-- Talepler: listings become text-only requests with a price range, an optional link and several rooms.
-- Test data only: existing rows are wiped (no backfill needed).
delete from public.listings;

drop function public.similar_listings(uuid, int);

alter table public.listings
  drop column price,
  drop column photos,
  add column min_price numeric check (min_price is null or min_price >= 0),
  add column max_price numeric check (max_price is null or max_price >= 0),
  add column link text check (link is null or link ~* '^https?://'),
  add constraint listings_price_range check (min_price is null or max_price is null or min_price <= max_price);

alter table public.listings
  alter column rooms type text[] using (case when rooms is null then '{}'::text[] else array[rooms] end),
  alter column rooms set default '{}',
  alter column rooms set not null;

create index listings_search_idx on public.listings (type, district);

-- Similar talepler: same type required; neighborhood +3, district +2, price ranges overlap +2
-- (both need at least one bound; a missing bound is open-ended), any shared room +1,
-- area within 20% +1; at least 3 points to qualify.
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
      + (case when (s.min_price is not null or s.max_price is not null)
               and (l.min_price is not null or l.max_price is not null)
               and coalesce(l.max_price, 'Infinity'::numeric) >= coalesce(s.min_price, 0)
               and coalesce(l.min_price, 0) <= coalesce(s.max_price, 'Infinity'::numeric)
              then 2 else 0 end)
      + (case when s.rooms <> '{}' and l.rooms && s.rooms then 1 else 0 end)
      + (case when s.area_m2 is not null and l.area_m2 between s.area_m2 * 0.8 and s.area_m2 * 1.2 then 1 else 0 end)
      as score
  ) sc
  where l.id <> s.id and l.type = s.type and sc.score >= 3
  order by sc.score desc, l.created_at desc
  limit p_limit;
$$;

revoke execute on function public.similar_listings(uuid, int) from public, anon;
grant execute on function public.similar_listings(uuid, int) to authenticated;

-- Listing photos are gone. Remove the policies; the (now unused) bucket cannot be dropped with SQL:
-- storage blocks direct deletes, so delete the "listing-photos" bucket in Dashboard > Storage.
drop policy listing_photos_select on storage.objects;
drop policy listing_photos_insert on storage.objects;
drop policy listing_photos_update on storage.objects;
drop policy listing_photos_delete on storage.objects;
