-- RLS tests. Run with execute_sql (or psql). Everything rolls back: success is the
-- exception message 'RLS TESTS PASSED'. Any other error is a failing test.
do $$
declare
  admin_id uuid := gen_random_uuid();
  pend_id  uuid := gen_random_uuid();
  appr_id  uuid := gen_random_uuid();
  n int;
begin
  insert into auth.users (id, email) values
    (admin_id, 'admin@t.test'), (pend_id, 'pending@t.test'), (appr_id, 'approved@t.test');

  -- trigger creates a pending member profile for every new user
  select count(*) into n from public.profiles where id in (admin_id, pend_id, appr_id) and role = 'member' and status = 'pending';
  assert n = 3, 'new users get pending member profiles';

  update public.profiles set role = 'admin', status = 'approved' where id = admin_id;
  update public.profiles set status = 'approved' where id = appr_id;
  insert into public.firms (owner_id, name) values (appr_id, 'Firma A'), (pend_id, 'Firma P');

  -- anonymous: nothing
  set local role anon;
  select count(*) into n from public.profiles; assert n = 0, 'anon sees no profiles';
  select count(*) into n from public.firms;    assert n = 0, 'anon sees no firms';
  reset role;

  -- pending member: only self, no firms of others
  perform set_config('request.jwt.claims', json_build_object('sub', pend_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.profiles where id <> pend_id; assert n = 0, 'pending sees no other profiles';
  select count(*) into n from public.profiles where id = pend_id;  assert n = 1, 'pending sees self';
  select count(*) into n from public.firms where owner_id <> pend_id; assert n = 0, 'pending sees no firms of others';
  reset role;

  -- approved member
  perform set_config('request.jwt.claims', json_build_object('sub', appr_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.profiles where id = pend_id; assert n = 0, 'approved does not see pending profiles';
  select count(*) into n from public.profiles where id in (admin_id, appr_id); assert n = 2, 'approved sees approved profiles';
  select count(*) into n from public.firms; assert n = 1, 'approved sees firms of approved members only';
  update public.profiles set full_name = 'Yeni Ad' where id = appr_id;
  get diagnostics n = row_count; assert n = 1, 'member can edit own name';
  begin
    update public.profiles set role = 'admin' where id = appr_id;
    raise exception 'member escalated to admin';
  exception when insufficient_privilege then null; end;
  update public.profiles set status = 'approved' where id = pend_id;
  get diagnostics n = row_count; assert n = 0, 'member cannot approve someone else';
  begin
    insert into public.firms (owner_id, name, sahibinden_url) values (appr_id, 'Kotu', 'https://evil.com/sahibinden.com');
    raise exception 'bad sahibinden url accepted';
  exception when check_violation then null; end;
  insert into public.firms (owner_id, name, sahibinden_url) values (appr_id, 'Iyi', 'https://www.sahibinden.com/magaza/iyi');
  begin
    insert into public.firms (owner_id, name) values (admin_id, 'Baskasi');
    raise exception 'member inserted firm for another owner';
  exception when insufficient_privilege then null; end;
  reset role;

  -- admin
  perform set_config('request.jwt.claims', json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.profiles; assert n = 3, 'admin sees all profiles';
  update public.profiles set status = 'approved' where id = pend_id;
  get diagnostics n = row_count; assert n = 1, 'admin can approve';
  reset role;

  raise exception 'RLS TESTS PASSED';
end $$;

-- Events and announcements: approved members read, only admins write.
do $$
declare
  admin_id uuid := gen_random_uuid();
  pend_id  uuid := gen_random_uuid();
  appr_id  uuid := gen_random_uuid();
  n int;
begin
  insert into auth.users (id, email) values
    (admin_id, 'admin2@t.test'), (pend_id, 'pending2@t.test'), (appr_id, 'approved2@t.test');
  update public.profiles set role = 'admin', status = 'approved' where id = admin_id;
  update public.profiles set status = 'approved' where id = appr_id;

  perform set_config('request.jwt.claims', json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.events (title, starts_at) values ('Genel Kurul', now() + interval '7 days');
  insert into public.announcements (title, body) values ('Duyuru', 'Metin');
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', pend_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.events; assert n = 0, 'pending sees no events';
  select count(*) into n from public.announcements; assert n = 0, 'pending sees no announcements';
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', appr_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.events; assert n = 1, 'member sees events';
  select count(*) into n from public.announcements; assert n = 1, 'member sees announcements';
  begin
    insert into public.events (title, starts_at) values ('Sahte', now());
    raise exception 'member created an event';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.announcements (title, body) values ('Sahte', 'x');
    raise exception 'member created an announcement';
  exception when insufficient_privilege then null; end;
  update public.events set title = 'Hack' where title = 'Genel Kurul';
  get diagnostics n = row_count; assert n = 0, 'member cannot edit events';
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.events set title = 'Genel Kurul 2' where title = 'Genel Kurul';
  get diagnostics n = row_count; assert n = 1, 'admin edits events';
  reset role;

  raise exception 'EVENTS TESTS PASSED';
end $$;

-- Push tokens: each user manages only their own.
do $$
declare
  a_id uuid := gen_random_uuid();
  b_id uuid := gen_random_uuid();
  n int;
begin
  insert into auth.users (id, email) values (a_id, 'a3@t.test'), (b_id, 'b3@t.test');

  perform set_config('request.jwt.claims', json_build_object('sub', a_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.push_tokens (user_id, token) values (a_id, 'ExponentPushToken[aaa]');
  begin
    insert into public.push_tokens (user_id, token) values (b_id, 'ExponentPushToken[bbb]');
    raise exception 'user registered a token for someone else';
  exception when insufficient_privilege then null; end;
  reset role;

  insert into public.push_tokens (user_id, token) values (b_id, 'ExponentPushToken[bbb]');

  perform set_config('request.jwt.claims', json_build_object('sub', a_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.push_tokens; assert n = 1, 'user sees only own token';
  reset role;

  set local role anon;
  select count(*) into n from public.push_tokens; assert n = 0, 'anon sees no tokens';
  reset role;

  raise exception 'PUSH TESTS PASSED';
end $$;

-- register_push_token moves a device token to the user who signed in last.
do $$
declare
  a_id uuid := gen_random_uuid();
  b_id uuid := gen_random_uuid();
  owner uuid;
begin
  insert into auth.users (id, email) values (a_id, 'a4@t.test'), (b_id, 'b4@t.test');
  perform set_config('request.jwt.claims', json_build_object('sub', a_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.register_push_token('ExponentPushToken[shared]');
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.register_push_token('ExponentPushToken[shared]');
  reset role;
  select user_id into owner from public.push_tokens where token = 'ExponentPushToken[shared]';
  assert owner = b_id, 'token moves to the user who signed in last';
  raise exception 'TOKEN MOVE PASSED';
end $$;

-- Listings: members-only, owner-managed; similar_listings scoring; Turkish-insensitive neighborhood key.
do $$
declare
  o_id uuid := gen_random_uuid();   -- approved owner
  m_id uuid := gen_random_uuid();   -- approved other member
  p_id uuid := gen_random_uuid();   -- pending
  l1 uuid; l2 uuid; l5 uuid;
  n int; k text;
begin
  insert into auth.users (id, email) values (o_id, 'o5@t.test'), (m_id, 'm5@t.test'), (p_id, 'p5@t.test');
  update public.profiles set status = 'approved' where id in (o_id, m_id);

  insert into public.listings (owner_id, title, type, district, neighborhood, min_price, max_price, rooms, area_m2) values
    (o_id, 'Incek villa', 'satilik', 'Gölbaşı', 'İncek', 9000000, 11000000, '{4+1}', 200) returning id into l1;
  insert into public.listings (owner_id, title, type, district, neighborhood, min_price, max_price, rooms, area_m2) values
    (o_id, 'Incek daire', 'satilik', 'Gölbaşı', 'Incek', 8000000, 9500000, '{3+1,4+1}', 190) returning id into l2;
  insert into public.listings (owner_id, title, type, district, neighborhood, min_price, max_price, rooms, area_m2) values
    (o_id, 'Eryaman daire', 'satilik', 'Etimesgut', 'Eryaman', 9000000, 11000000, '{3+1}', 150),
    (o_id, 'Incek kiralik', 'kiralik', 'Gölbaşı', 'İncek', 9000000, 11000000, '{4+1}', 200);
  insert into public.listings (owner_id, title, type, district) values
    (o_id, 'Fiyatsiz', 'satilik', 'Gölbaşı') returning id into l5;

  -- price range rules: open-ended ranges are fine, an inverted range is not
  insert into public.listings (owner_id, title, type, min_price) values (o_id, 'sadece min', 'satilik', 5000000);
  insert into public.listings (owner_id, title, type, max_price) values (o_id, 'sadece max', 'satilik', 5000000);
  begin
    insert into public.listings (owner_id, title, type, min_price, max_price) values (o_id, 'ters', 'satilik', 9, 5);
    raise exception 'inverted price range was accepted';
  exception when check_violation then null; end;
  begin
    insert into public.listings (owner_id, title, type, link) values (o_id, 'bad link', 'satilik', 'javascript:alert(1)');
    raise exception 'non-http link was accepted';
  exception when check_violation then null; end;

  select neighborhood_norm into k from public.listings where id = l1;
  assert k = 'incek', 'İncek is stored as incek';
  select neighborhood_norm into k from public.listings where id = l2;
  assert k = 'incek', 'Incek is stored as incek';

  -- pending sees nothing and cannot post
  perform set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.listings; assert n = 0, 'pending sees no listings';
  begin
    insert into public.listings (owner_id, title, type) values (p_id, 'x', 'satilik');
    raise exception 'pending member posted a listing';
  exception when insufficient_privilege then null; end;
  reset role;

  -- approved member: sees all, similar works, cannot post for or edit someone else
  perform set_config('request.jwt.claims', json_build_object('sub', m_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.listings; assert n = 7, 'member sees all listings';
  select count(*) into n from public.similar_listings(l1);
  assert n = 1, 'only the Incek 9M listing is similar to the Incek 10M one';
  select count(*) into n from public.similar_listings(l1) where id = l2; assert n = 1, 'similar is the 9M Incek listing';
  select count(*) into n from public.similar_listings(l5); assert n = 0, 'listing without price/rooms/area has no similar ones';
  begin
    insert into public.listings (owner_id, title, type) values (o_id, 'sahte', 'satilik');
    raise exception 'member posted for another owner';
  exception when insufficient_privilege then null; end;
  update public.listings set title = 'Hack' where id = l1;
  get diagnostics n = row_count; assert n = 0, 'member cannot edit someone elses listing';
  reset role;

  -- owner edits own
  perform set_config('request.jwt.claims', json_build_object('sub', o_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.listings set title = 'Incek villa 2' where id = l1;
  get diagnostics n = row_count; assert n = 1, 'owner edits own listing';
  reset role;

  raise exception 'LISTINGS TESTS PASSED';
end $$;

-- A member cannot attach another member's firm to a listing (insert or update).
do $$
declare
  a_id uuid := gen_random_uuid();
  b_id uuid := gen_random_uuid();
  fa uuid; fb uuid; la uuid; n int;
begin
  insert into auth.users (id, email) values (a_id, 'a8@t.test'), (b_id, 'b8@t.test');
  update public.profiles set status = 'approved' where id in (a_id, b_id);
  insert into public.firms (owner_id, name) values (a_id, 'Firma A') returning id into fa;
  insert into public.firms (owner_id, name) values (b_id, 'Firma B') returning id into fb;

  perform set_config('request.jwt.claims', json_build_object('sub', a_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.listings (owner_id, title, type, firm_id) values (a_id, 'own firm ok', 'satilik', fa) returning id into la;
  begin
    insert into public.listings (owner_id, title, type, firm_id) values (a_id, 'stolen firm', 'satilik', fb);
    raise exception 'member attached someone elses firm on insert';
  exception when insufficient_privilege then null; end;
  begin
    update public.listings set firm_id = fb where id = la;
    raise exception 'member attached someone elses firm on update';
  exception when insufficient_privilege then null; end;
  reset role;

  raise exception 'FIRM OWNERSHIP TESTS PASSED';
end $$;

-- Event photos: approved members read, only admins write, at most 10 per event.
do $$
declare
  a_id uuid := gen_random_uuid();   -- admin
  m_id uuid := gen_random_uuid();   -- approved member
  p_id uuid := gen_random_uuid();   -- pending
  ev uuid; ev2 uuid;
  n int;
begin
  insert into auth.users (id, email) values (a_id, 'a10@t.test'), (m_id, 'm10@t.test'), (p_id, 'p10@t.test');
  update public.profiles set role = 'admin', status = 'approved' where id = a_id;
  update public.profiles set status = 'approved' where id = m_id;
  insert into public.events (title, starts_at) values ('Test etkinlik', now()) returning id into ev;
  insert into public.events (title, starts_at) values ('Bos etkinlik', now()) returning id into ev2;

  -- admin writes
  perform set_config('request.jwt.claims', json_build_object('sub', a_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.event_photos (event_id, url, position)
    select ev, 'https://x.test/' || g || '.jpg', g from generate_series(0, 9) g;
  begin
    insert into public.event_photos (event_id, url, position) values (ev, 'https://x.test/11.jpg', 10);
    raise exception 'an 11th photo was accepted';
  exception when check_violation then null; end;
  reset role;

  -- approved member reads, cannot write
  perform set_config('request.jwt.claims', json_build_object('sub', m_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.event_photos where event_id = ev; assert n = 10, 'member sees event photos';
  begin
    insert into public.event_photos (event_id, url) values (ev2, 'https://x.test/hack.jpg');
    raise exception 'member inserted an event photo';
  exception when insufficient_privilege then null; end;
  delete from public.event_photos where event_id = ev;
  get diagnostics n = row_count; assert n = 0, 'member cannot delete event photos';
  reset role;

  -- pending sees nothing
  perform set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.event_photos; assert n = 0, 'pending sees no event photos';
  reset role;

  raise exception 'EVENT PHOTOS TESTS PASSED';
end $$;

-- Roles and titles: only admins set them; scanners can scan, plain members and pending scanners cannot.
do $$
declare
  a_id uuid := gen_random_uuid();   -- admin
  s_id uuid := gen_random_uuid();   -- approved scanner
  m_id uuid := gen_random_uuid();   -- approved member
  ps_id uuid := gen_random_uuid();  -- pending scanner
  ok boolean;
  t text;
begin
  insert into auth.users (id, email) values
    (a_id, 'a11@t.test'), (s_id, 's11@t.test'), (m_id, 'm11@t.test'), (ps_id, 'ps11@t.test');
  update public.profiles set role = 'admin', status = 'approved' where id = a_id;
  update public.profiles set role = 'scanner', status = 'approved' where id = s_id;
  update public.profiles set status = 'approved' where id = m_id;
  update public.profiles set role = 'scanner' where id = ps_id;

  -- a member cannot give themselves a title or a role
  perform set_config('request.jwt.claims', json_build_object('sub', m_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    update public.profiles set title = 'Başkan' where id = m_id;
    raise exception 'member set own title';
  exception when insufficient_privilege then null; end;
  begin
    update public.profiles set role = 'scanner' where id = m_id;
    raise exception 'member set own role';
  exception when insufficient_privilege then null; end;
  select public.can_scan() into ok; assert ok = false, 'plain member cannot scan';
  reset role;

  -- an admin can set a title and a scanner role
  perform set_config('request.jwt.claims', json_build_object('sub', a_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.profiles set title = 'Başkan Yardımcısı', role = 'scanner' where id = m_id;
  select public.can_scan() into ok; assert ok = true, 'admin can scan';
  reset role;
  select title into t from public.profiles where id = m_id; assert t = 'Başkan Yardımcısı', 'title saved';

  -- scanner scans; a pending scanner does not
  perform set_config('request.jwt.claims', json_build_object('sub', s_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select public.can_scan() into ok; assert ok = true, 'scanner can scan';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', ps_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select public.can_scan() into ok; assert ok = false, 'pending scanner cannot scan';
  reset role;

  raise exception 'ROLES TESTS PASSED';
end $$;

-- Signup consent is recorded from the signup metadata.
do $$
declare
  c1 uuid := gen_random_uuid();
  c2 uuid := gen_random_uuid();
  ts timestamptz; ec boolean;
begin
  insert into auth.users (id, email, raw_user_meta_data) values
    (c1, 'c1@t.test', '{"full_name":"A","terms_accepted":true,"email_consent":true}'::jsonb),
    (c2, 'c2@t.test', '{"full_name":"B"}'::jsonb);
  select terms_accepted_at, email_consent into ts, ec from public.profiles where id = c1;
  assert ts is not null and ec = true, 'consent recorded';
  select terms_accepted_at, email_consent into ts, ec from public.profiles where id = c2;
  assert ts is null and ec = false, 'no consent without metadata';
  raise exception 'CONSENT TESTS PASSED';
end $$;
