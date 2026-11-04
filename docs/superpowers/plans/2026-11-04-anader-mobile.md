# ANEDER Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Turkish-only, members-only Expo app for ANEDER agents: events + push, profiles with firms, listings with filters/similar listings, member directory, in-app admin.

**Architecture:** Expo (expo-router, TypeScript) client talks directly to Supabase (Auth, Postgres, Storage). Access rules live in Row Level Security, not in the UI. Two Edge Functions run privileged work: `send-push` and `delete-account`.

**Tech Stack:** Expo SDK (latest), expo-router, TypeScript, @supabase/supabase-js, expo-notifications, expo-image-picker, jest-expo for pure-logic tests.

**Spec:** `docs/superpowers/specs/2026-11-04-anader-mobile-design.md`

## Global Constraints

- Turkish UI text only, all strings in `src/i18n/tr.ts` (no inline literals in screens).
- Bottom tabs, in this order: Anasayfa · Etkinlikler · İlanlar · Üyeler · Profil.
- Supabase project `unlsvmrethwpslhsubdy` (eu-central-1, account anederdb). GitHub `anederdb/AnederMobile`. No other credentials.
- Roles: `profiles.role` in (`member`,`admin`); `profiles.status` in (`pending`,`approved`). Enforced by RLS.
- Listings and member directory visible to approved members only. No anonymous access.
- Sahibinden links are plain URLs; no scraping.
- Only the anon/publishable key is in the app. The service-role key never leaves Edge Functions.
- After each task: web build (`npx expo start --web`) in a phone-sized window, screenshots saved to `screenshots/<task-number>-<name>/`. Push delivery is checked by hand on a phone.
- No Playwright test suite (deferred by user).

## Review Focus

1. A pending member calls the API directly for listings/members: must get zero rows (test in Task 2).
2. A member tries to set their own `role='admin'` or `status='approved'`: must be rejected (Task 2).
3. Sahibinden URL that is not an https `sahibinden.com` link, or an empty string: rejected/ignored, never rendered as a tappable link (Task 3).
4. Deleting the account of a user with firms, listings and a push token: nothing orphaned, auth user gone (Task 3).
5. Similar listings for a listing with no matches, or a missing price/rooms: returns an empty list, not an error (Task 6).

---

### Task 1: Scaffold, repo, environment

**Files:**
- Create: Expo project in repo root, `.env.example`, `.gitignore` entries (`.env`, `.superpowers/`), `README.md`, `src/lib/supabase.ts`, `src/i18n/tr.ts`
- Create: `app/(tabs)/_layout.tsx` with the five tabs and placeholder screens

**Interfaces:**
- Produces: `supabase: SupabaseClient` exported from `src/lib/supabase.ts`; `t: typeof tr` from `src/i18n/tr.ts`.

- [ ] **Step 1:** Scaffold with `create-expo-app` (TypeScript, expo-router) into the existing folder; keep `docs/`.
- [ ] **Step 2:** Write `src/lib/supabase.ts` reading `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (values from `get_project_url` / `get_publishable_keys`), with AsyncStorage session persistence. Put real values in `.env` (gitignored), placeholders in `.env.example`.
- [ ] **Step 3:** Five placeholder tabs with Turkish labels from `tr.ts`.
- [ ] **Step 4:** Verify: `npx expo start --web` renders the five tabs; screenshot to `screenshots/01-scaffold/`.
- [ ] **Step 5:** Commit; set remote `https://github.com/anederdb/AnederMobile.git`; push (confirm with user before the first push).

### Task 2: Database core, roles, RLS

**Files:**
- Create: `supabase/migrations/0001_core.sql`, `supabase/tests/rls.sql`

**Interfaces:**
- Produces tables: `profiles(id uuid pk → auth.users, full_name text, phone text, avatar_url text, role text, status text, created_at)`, `firms(id, owner_id → profiles, name, district, sahibinden_url, created_at)`.
- Produces functions: `is_admin() returns boolean`, `is_approved() returns boolean` (both `security definer`, read the caller's profile).
- Trigger: on `auth.users` insert, create a `profiles` row with `role='member'`, `status='pending'`.

- [ ] **Step 1:** Write `supabase/tests/rls.sql` first. It creates three test users (pending member, approved member, admin) and asserts: pending reads 0 rows from `firms` of others; approved reads all `approved` profiles; a member `update profiles set role='admin'` or `status='approved'` on themself fails; admin can set `status='approved'` on another user.
- [ ] **Step 2:** Run it against the project with `execute_sql`; expect failures (no tables).
- [ ] **Step 3:** Write the migration. Policies: self can read/update own profile except `role`/`status` (enforce with a trigger that blocks changes to those columns unless `is_admin()`); approved members read approved profiles and all firms; owner CRUD on own firms; admin all.
- [ ] **Step 4:** Apply with `apply_migration`, rerun `rls.sql`: all assertions pass. Run `get_advisors` (security): no RLS warnings.
- [ ] **Step 5:** Commit.

### Task 3: Auth, pending gate, profile, firms, delete account

**Files:**
- Create: `app/(auth)/login.tsx`, `app/(auth)/register.tsx`, `app/pending.tsx`, `app/(tabs)/profil/index.tsx`, `app/(tabs)/profil/firms.tsx`, `src/lib/sahibinden.ts`, `src/lib/sahibinden.test.ts`, `supabase/functions/delete-account/index.ts`
- Modify: `app/_layout.tsx` (route guard)

**Interfaces:**
- Consumes: `supabase`, `t`, `profiles`, `firms`.
- Produces: `useSession(): { session, profile, loading }` in `src/lib/session.ts`; `normalizeSahibindenUrl(input: string): string | null`.

- [ ] **Step 1:** Write `sahibinden.test.ts`: `normalizeSahibindenUrl("https://www.sahibinden.com/magaza/x")` returns the same URL; `"sahibinden.com/magaza/x"` returns `"https://sahibinden.com/magaza/x"`; `""`, `"javascript:alert(1)"`, `"https://evil.com/sahibinden.com"` return `null`. Run, see fail, implement, see pass.
- [ ] **Step 2:** Register (email, password, full name, phone), login, logout. Route guard: no session → login; `status='pending'` → `/pending`; approved → tabs.
- [ ] **Step 3:** Profil tab: edit name/phone/avatar (Storage bucket `avatars`, owner-only write). Firms screen: add/edit/delete firms, Sahibinden field saved only through `normalizeSahibindenUrl`; a tap opens the link with `Linking.openURL`.
- [ ] **Step 4:** `delete-account` Edge Function: verify the caller's JWT, delete that user with the service-role client (`auth.admin.deleteUser`); FKs use `on delete cascade` so profile, firms, listings, push tokens go too. Profil has a confirm dialog "Hesabı sil".
- [ ] **Step 5:** Verify: register → see pending screen → approve via SQL → see tabs → add firm with link → delete account → `select count(*)` on `profiles`, `firms` for that id is 0. Screenshots to `screenshots/03-auth-profile/`.
- [ ] **Step 6:** Commit.

### Task 4: Events and announcements, admin screens, member approval

**Files:**
- Create: `supabase/migrations/0002_events.sql`, `app/(tabs)/etkinlikler/index.tsx`, `app/(tabs)/etkinlikler/[id].tsx`, `app/(tabs)/index.tsx` (Anasayfa), `app/admin/events.tsx`, `app/admin/announcements.tsx`, `app/admin/members.tsx`

**Interfaces:**
- Produces tables: `events(id, title, description, location, starts_at timestamptz, cover_url, created_by, created_at)`, `announcements(id, title, body, cover_url, created_at)`. Read: approved members. Write: `is_admin()` only.
- Admin screens reachable from Profil only when `profile.role === 'admin'`.

- [ ] **Step 1:** Extend `supabase/tests/rls.sql`: a member insert into `events` fails, an admin insert succeeds, a pending user reads 0 events. Run, see fail.
- [ ] **Step 2:** Migration + cover image bucket (`covers`, admin write, member read). Rerun tests: pass.
- [ ] **Step 3:** Screens: events list (upcoming first, past dimmed), event detail, Anasayfa showing next event card + latest announcements. Admin: create/edit/delete event and announcement, list pending members with Onayla / Reddet.
- [ ] **Step 4:** Verify as admin and as member on web; screenshots to `screenshots/04-events-admin/`. Commit.

### Task 5: Push notifications

**Files:**
- Create: `supabase/migrations/0003_push.sql`, `supabase/functions/send-push/index.ts`, `src/lib/push.ts`, `app/admin/send-push.tsx`

**Interfaces:**
- Produces: table `push_tokens(user_id → profiles on delete cascade, token text unique)`; `registerForPush(): Promise<void>`; Edge Function `send-push` taking `{ title: string, body: string, eventId?: string }`, rejecting non-admin callers, sending via the Expo push API in batches of 100 to all approved members' tokens.

- [ ] **Step 1:** Test (SQL): a member cannot read other users' tokens. Migration, pass.
- [ ] **Step 2:** `registerForPush` stores the token after approval; web skips silently.
- [ ] **Step 3:** `send-push`: verify caller `is_admin`; fetch tokens with the service role; send; delete tokens the Expo API reports as `DeviceNotRegistered`.
- [ ] **Step 4:** Admin screen: title + body + optional "attach to event", plus a checkbox on event creation "Bildirim gönder". Verify: a non-admin call returns 403; an admin call returns the sent count; screenshots of the admin form to `screenshots/05-push/`. Manual phone check of delivery.
- [ ] **Step 5:** Commit.

### Task 6: Listings, filters, similar listings

**Files:**
- Create: `supabase/migrations/0004_listings.sql`, `app/(tabs)/ilanlar/index.tsx`, `app/(tabs)/ilanlar/[id].tsx`, `app/(tabs)/ilanlar/new.tsx`, `src/lib/listingFilters.ts`, `src/lib/listingFilters.test.ts`

**Interfaces:**
- Produces: table `listings(id, owner_id → profiles on delete cascade, firm_id → firms on delete set null, title, type text ('satilik'|'kiralik'), district text, price numeric, rooms text, area_m2 numeric, description, photos text[], created_at)`; SQL function `similar_listings(p_listing_id uuid, p_limit int default 5) returns setof listings`; `buildListingQuery(filters: ListingFilters): PostgrestFilter` in `listingFilters.ts` where `ListingFilters = { district?, type?, minPrice?, maxPrice?, rooms? }`.
- Similar scoring: same district +3, price within ±20% +2, same rooms +1, area within ±20% +1; exclude the listing itself; require score ≥ 3; order by score desc, then created_at desc.

- [ ] **Step 1:** SQL tests: for a seeded 10M listing in İncek, `similar_listings` returns a 9M İncek listing, excludes a 10M Etimesgut listing with a different room count, and returns an empty set for a listing with null price. Pending user gets 0 listings.
- [ ] **Step 2:** `listingFilters.test.ts`: empty filters produce no constraints; `minPrice > maxPrice` is normalized by swapping. Run, fail, implement, pass.
- [ ] **Step 3:** Migration with RLS (approved read; owner write; admin delete), photo bucket `listing-photos`, function. Rerun tests: pass.
- [ ] **Step 4:** Screens: filterable list, detail with owner/firm and "Benzer ilanlar", create/edit with up to 8 photos.
- [ ] **Step 5:** Verify and screenshot to `screenshots/06-listings/`. Commit.

### Task 7: Member directory

**Files:**
- Create: `app/(tabs)/uyeler/index.tsx`, `app/(tabs)/uyeler/[id].tsx`

- [ ] **Step 1:** SQL test already covers visibility; add one: approved member sees approved profiles but not pending ones.
- [ ] **Step 2:** Searchable list by name or firm; detail shows firms with Sahibinden links, phone (tap to call), their listings.
- [ ] **Step 3:** Verify and screenshot to `screenshots/07-members/`. Commit.

### Task 8: Brand and UI polish

**Files:**
- Modify: screens and shared components; Create: `src/theme.ts`, `assets/` (logo)

- [ ] **Step 1:** Invoke the `ui-ux-pro-max` skill; derive colors from the ANEDER logo (`aneder_logo.jpg` on the website) and define tokens in `src/theme.ts`.
- [ ] **Step 2:** Apply to home (event hero card, announcement cards), tab bar, lists and forms; add loading/empty/error states.
- [ ] **Step 3:** Update `README.md` (setup, env, Supabase, how to run). Final screenshots of every screen to `screenshots/08-polish/`. Commit and push.

---

## Self-review notes

- Spec coverage: signup/approval (3,4), profile + firms + Sahibinden + delete (3), listings + filters + similar (6), events/announcements/admin/push (4,5), directory (7), Turkish only and brand (1,8), screenshots (every task). Playwright is excluded per user.
- The spec's open item about listing fields is settled in Task 6.
