-- Fix: inside the subquery the bare `owner_id` resolved to firms.owner_id, so the firm-ownership
-- check compared a firm's owner to itself. Compare against the listing's owner instead.
-- (ALTER POLICY rather than drop/create: same result, and the Supabase SQL tool refuses DROP.)
alter policy listings_insert on public.listings
  with check (
    owner_id = (select auth.uid()) and public.is_approved()
    and (firm_id is null or exists (
      select 1 from public.firms f where f.id = listings.firm_id and f.owner_id = listings.owner_id
    ))
  );

alter policy listings_update on public.listings
  with check (
    (owner_id = (select auth.uid()) or public.is_admin())
    and (firm_id is null or exists (
      select 1 from public.firms f where f.id = listings.firm_id and f.owner_id = listings.owner_id
    ))
  );
