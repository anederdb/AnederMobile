-- Talepler Al / Ver. Every post is either 'al' (the member is looking) or 'ver' (the member offers something).
-- Existing posts were all "my customer is looking" requests, so they become 'al'.
alter table public.listings add column side text not null default 'al' check (side in ('al', 'ver'));
create index listings_side_idx on public.listings (side, type, district);

-- Match score between two posts, null when they are not a match.
-- A match needs: opposite sides, same type (satilik/kiralik), the same non-null district, and overlapping
-- price ranges (a missing bound is open-ended, so "no price" fits any price).
-- Ranking points: same neighborhood +3, any shared room +2, area within 20% +1.
create function public.match_score(a public.listings, b public.listings) returns int
language sql immutable set search_path = '' as $$
  select case
    when a.side <> b.side
     and a.type = b.type
     and a.district is not null and a.district = b.district
     and coalesce(b.max_price, 'Infinity'::numeric) >= coalesce(a.min_price, 0)
     and coalesce(b.min_price, 0) <= coalesce(a.max_price, 'Infinity'::numeric)
    then (case when a.neighborhood_norm <> '' and a.neighborhood_norm = b.neighborhood_norm then 3 else 0 end)
       + (case when a.rooms <> '{}' and b.rooms && a.rooms then 2 else 0 end)
       + (case when a.area_m2 is not null and b.area_m2 between a.area_m2 * 0.8 and a.area_m2 * 1.2 then 1 else 0 end)
  end
$$;

-- Posts of the opposite side that match one post, best first.
create function public.matching_listings(p_listing_id uuid, p_limit int default 10)
returns setof public.listings
language sql stable security invoker set search_path = '' as $$
  select l.*
  from public.listings l
  join public.listings s on s.id = p_listing_id
  cross join lateral (select public.match_score(s, l) as score) m
  where l.id <> s.id and m.score is not null
  order by m.score desc, l.created_at desc
  limit p_limit;
$$;

-- "Recommended for me": other members' posts that match any of the caller's own posts, best match first.
create function public.my_recommendations(p_limit int default 50)
returns setof public.listings
language sql stable security invoker set search_path = '' as $$
  select l.*
  from public.listings l
  cross join lateral (
    select max(public.match_score(mine, l)) as score
    from public.listings mine
    where mine.owner_id = (select auth.uid())
  ) r
  where l.owner_id <> (select auth.uid()) and r.score is not null
  order by r.score desc, l.created_at desc
  limit p_limit;
$$;

-- "Benzer talepler" now only compares posts of the same side (opposite sides are handled by matching_listings).
create or replace function public.similar_listings(p_listing_id uuid, p_limit int default 5)
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
  where l.id <> s.id and l.type = s.type and l.side = s.side and sc.score >= 3
  order by sc.score desc, l.created_at desc
  limit p_limit;
$$;

revoke execute on function public.match_score(public.listings, public.listings) from public, anon;
revoke execute on function public.matching_listings(uuid, int) from public, anon;
revoke execute on function public.my_recommendations(int) from public, anon;
grant execute on function public.match_score(public.listings, public.listings) to authenticated;
grant execute on function public.matching_listings(uuid, int) to authenticated;
grant execute on function public.my_recommendations(int) to authenticated;
