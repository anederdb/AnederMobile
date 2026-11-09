-- Etkinlik photos: several per event, shown as a swipeable carousel. events.cover_url stays as the first photo.
create table public.event_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index event_photos_event_id_idx on public.event_photos (event_id, position);

-- at most 10 photos per event
create function public.enforce_event_photo_limit() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (select count(*) from public.event_photos where event_id = new.event_id) >= 10 then
    raise exception 'an event can have at most 10 photos' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
create trigger event_photos_limit before insert on public.event_photos
  for each row execute function public.enforce_event_photo_limit();

alter table public.event_photos enable row level security;

create policy event_photos_select on public.event_photos for select to authenticated using (public.is_approved());
create policy event_photos_admin_insert on public.event_photos for insert to authenticated with check (public.is_admin());
create policy event_photos_admin_update on public.event_photos for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy event_photos_admin_delete on public.event_photos for delete to authenticated using (public.is_admin());

-- existing single covers become the first photo
insert into public.event_photos (event_id, url, position)
select id, cover_url, 0 from public.events where cover_url is not null;
