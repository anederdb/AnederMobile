-- A device token belongs to whoever signed in on it last.
create function public.register_push_token(p_token text) returns void
language sql security definer set search_path = '' as $$
  insert into public.push_tokens (token, user_id) values (p_token, (select auth.uid()))
  on conflict (token) do update set user_id = (select auth.uid());
$$;

revoke execute on function public.register_push_token(text) from public, anon;
grant execute on function public.register_push_token(text) to authenticated;
