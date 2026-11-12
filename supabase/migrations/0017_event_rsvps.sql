-- Etkinlik RSVP: each approved member answers "Katılacağım" (going) or "Katılamayacağım" (not_going) per event.
-- Members see and change only their own answer, and only until the event starts. Admins read everyone's.
create table public.event_rsvps (
  event_id uuid not null references public.events (id) on delete cascade,
  member_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  status text not null check (status in ('going', 'not_going')),
  updated_at timestamptz not null default now(),
  primary key (event_id, member_id)
);
create index event_rsvps_member_id_idx on public.event_rsvps (member_id);

alter table public.event_rsvps enable row level security;

create policy event_rsvps_select on public.event_rsvps for select to authenticated
  using (member_id = (select auth.uid()) or public.is_admin());

create policy event_rsvps_insert on public.event_rsvps for insert to authenticated
  with check (
    member_id = (select auth.uid())
    and public.is_approved()
    and exists (select 1 from public.events e where e.id = event_id and e.starts_at > now())
  );

create policy event_rsvps_update on public.event_rsvps for update to authenticated
  using (member_id = (select auth.uid()))
  with check (
    member_id = (select auth.uid())
    and public.is_approved()
    and exists (select 1 from public.events e where e.id = event_id and e.starts_at > now())
  );

-- A member can withdraw their answer while the event is still ahead.
create policy event_rsvps_delete on public.event_rsvps for delete to authenticated
  using (
    member_id = (select auth.uid())
    and exists (select 1 from public.events e where e.id = event_id and e.starts_at > now())
  );
