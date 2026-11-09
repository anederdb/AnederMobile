-- QR check-in. A member's QR holds a short-lived single-use token (never their id). Scanners and
-- admins send the token to check_in(), which verifies everything server-side and records attendance.

create table public.qr_tokens (
  token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz
);
create index qr_tokens_user_id_idx on public.qr_tokens (user_id);
-- RLS on with no policies: tokens are only reachable through the functions below.
alter table public.qr_tokens enable row level security;

create table public.event_checkins (
  event_id uuid not null references public.events (id) on delete cascade,
  member_id uuid not null references public.profiles (id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid references public.profiles (id) on delete set null,
  primary key (event_id, member_id)
);
alter table public.event_checkins enable row level security;
-- Admins read the attendance list. No insert/update policy: rows are only written by check_in().
create policy event_checkins_admin_select on public.event_checkins for select to authenticated using (public.is_admin());

-- Valid for 90 seconds; the app asks for a fresh one about every 60 seconds.
create function public.issue_qr_token() returns text
language plpgsql security definer set search_path = '' as $$
declare
  t text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
begin
  if not public.is_approved() then
    raise exception 'only approved members have a QR' using errcode = 'insufficient_privilege';
  end if;
  delete from public.qr_tokens
    where user_id = (select auth.uid()) and (expires_at < now() or used_at is not null);
  insert into public.qr_tokens (token, user_id, expires_at)
    values (t, (select auth.uid()), now() + interval '90 seconds');
  return t;
end;
$$;

-- Returns {"status":"ok"|"already","member_name":...} or {"status":"invalid"}.
-- Raises insufficient_privilege unless the caller is an approved scanner or admin.
create function public.check_in(p_event_id uuid, p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_member uuid;
  v_name text;
  v_rows int;
begin
  if not public.can_scan() then
    raise exception 'not allowed to scan' using errcode = 'insufficient_privilege';
  end if;

  update public.qr_tokens set used_at = now()
    where token = p_token and used_at is null and expires_at > now()
    returning user_id into v_member;
  if v_member is null then
    return jsonb_build_object('status', 'invalid');
  end if;

  select full_name into v_name from public.profiles where id = v_member and status = 'approved';
  if not found then
    return jsonb_build_object('status', 'invalid');
  end if;

  insert into public.event_checkins (event_id, member_id, checked_in_by)
    values (p_event_id, v_member, (select auth.uid()))
    on conflict do nothing;
  get diagnostics v_rows = row_count;

  return jsonb_build_object('status', case when v_rows = 0 then 'already' else 'ok' end, 'member_name', v_name);
end;
$$;

create function public.remove_check_in(p_event_id uuid, p_member_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'admins only' using errcode = 'insufficient_privilege';
  end if;
  delete from public.event_checkins where event_id = p_event_id and member_id = p_member_id;
end;
$$;

revoke execute on function public.issue_qr_token(), public.check_in(uuid, text), public.remove_check_in(uuid, uuid) from public, anon;
grant execute on function public.issue_qr_token(), public.check_in(uuid, text), public.remove_check_in(uuid, uuid) to authenticated;
