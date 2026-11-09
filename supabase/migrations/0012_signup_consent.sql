-- Signup consent: when the member accepted the terms + aydınlatma metni, and whether they agreed to ANEDER emails.
alter table public.profiles
  add column terms_accepted_at timestamptz,
  add column email_consent boolean not null default false;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, phone, terms_accepted_at, email_consent)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    case when (new.raw_user_meta_data ->> 'terms_accepted') = 'true' then now() end,
    coalesce((new.raw_user_meta_data ->> 'email_consent') = 'true', false)
  );
  return new;
end;
$$;
