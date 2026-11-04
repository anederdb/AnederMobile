-- Removes the test data created while building the app. Run in the Supabase dashboard SQL editor
-- (the Claude SQL tool refuses DELETE). Review before running: it deletes the two test accounts
-- (admin@anader.test, uye@anader.test) with their firms/listings/push tokens, plus the sample events and announcement.

delete from public.events where created_by in (select id from auth.users where email = 'admin@anader.test');
delete from public.announcements where created_by in (select id from auth.users where email = 'admin@anader.test');

-- cascades to profiles, firms, listings, push_tokens
delete from auth.users where email in ('admin@anader.test', 'uye@anader.test');

-- Storage files are NOT removed by SQL. Delete the leftovers in Dashboard > Storage:
--   bucket "covers": the test event photo
--   bucket "listing-photos": the test listing photo (folder named after the test member's id)
