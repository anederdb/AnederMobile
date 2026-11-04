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
