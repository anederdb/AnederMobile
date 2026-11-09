# ANEDER Feedback Round 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn İlanlar into text-only Talepler, polish etkinlik/duyuru creation, add titles, Hakkımızda, Üyelere Özel, forgot-password, legal consent, email + push publishing, and QR check-in.

**Architecture:** Same Expo + Supabase app. Schema changes are new numbered migrations (`supabase/migrations/0009`–`0014`), enforced by RLS and security-definer RPCs and covered in `supabase/tests/rls.sql`. Pure logic lives in `src/lib/*.ts` with Jest tests; screens stay thin. Email goes through a new `send-email` Edge Function; push through the existing `send-push`.

**Tech Stack:** Expo SDK 58 (expo-router, `@expo/ui`, `expo-image`, `expo-notifications`), Supabase (Postgres, Storage, Edge Functions/Deno), Resend (email), `expo-camera`, `react-native-qrcode-svg`.

**Spec:** `docs/superpowers/specs/2026-11-09-feedback-round-design.md` (builds on `2026-11-04-anader-mobile-design.md`)

## Global Constraints

- Before touching any Expo/RN API, read the matching SDK 58 docs (`https://docs.expo.dev/versions/v58.0.0/`); install packages only with `npx expo install`. (`AGENTS.md`)
- Routes live in `src/app/`; non-route code stays outside it. Turkish only; every new string goes in `src/i18n/tr.ts`.
- "İlan" becomes "Talep" everywhere; `ilanlar` routes are deleted (no redirects). DB table stays `listings`.
- Titles never grant permissions; permissions are `profiles.role` (`member | admin | scanner`); only admins write role/status/title. RLS is the enforcement layer, not the UI.
- Test data may be wiped; no backfill needed.
- Sender address `info@aneder.org`; real delivery is untestable until the domain is verified, test with the provider sandbox sender.
- Email/push failure never undoes a published duyuru/etkinlik.
- Run `npx expo lint`, `npx tsc --noEmit` and `npx jest` before every commit that touches `src/`; before declaring any task done.
- Applying migrations: use the Supabase tool if authorized in the session, otherwise the user pastes the SQL into the Supabase SQL editor (project `anader-mobile`, `unlsvmrethwpslhsubdy`). Ask the user once at the first migration.
- Web build screenshots (phone-sized) go to `screenshots/09-feedback/<task>/`; push, camera and email delivery are checked by hand on a phone.

## Review Focus

1. Talep with only a min, only a max, or neither price; min greater than max in the form. Expected: saves when one or none is given, form rejects min > max, similar-matching treats a missing bound as open-ended. (Task 3, 4)
2. Double tap or slow-network retry on any create button (etkinlik, duyuru, talep, offer). Expected: exactly one row. (Task 1, 6, 7)
3. QR misuse: expired token, already-used token (screenshot reuse), a pending member's token, a non-scanner calling `check_in`, scanning the same member twice. Expected: no check-in, or "already". (Task 14)
4. Publishing when push/email returns errors, zero recipients, or the function is unreachable. Expected: the post is saved, the admin sees a clear message. (Task 11)
5. A normal member trying to set their own role/title via the API. Expected: rejected by the trigger. (Task 8)

---

### Task 1: Foundations — keyboard/scroll, single-flight helper, welcome name

**Files:**
- Modify: `src/components/Screen.tsx`, `src/app/(tabs)/index.tsx:44`
- Create: `src/lib/singleFlight.ts`, `src/lib/singleFlight.test.ts`

**Interfaces:**
- Produces: `singleFlight<A extends unknown[], R>(fn: (...args: A) => Promise<R>): (...args: A) => Promise<R | undefined>` — while a call is pending, further calls return `undefined` without invoking `fn`; the lock clears when `fn` settles (resolve or reject).

- [ ] **Step 1: Write `singleFlight.test.ts`:** (a) two overlapping calls invoke `fn` once and the second resolves `undefined`; (b) after the first settles a new call runs; (c) after `fn` rejects the lock is released.
- [ ] **Step 2: Run** `npx jest src/lib/singleFlight` — expect FAIL (module missing).
- [ ] **Step 3: Implement `singleFlight`** with a closure boolean released in `finally`.
- [ ] **Step 4: Run** the same test — expect PASS.
- [ ] **Step 5: Make `Screen` keyboard-safe:** wrap the `ScrollView` in `KeyboardAvoidingView` (behavior `padding` on iOS, per SDK 58/RN 0.88 docs for Android `softwareKeyboardLayoutMode`), set `keyboardDismissMode="on-drag"`, and add bottom padding so the last field can scroll above the keyboard. Check the Android `app.json` keyboard mode and fix there if the view does not resize.
- [ ] **Step 6: Welcome:** in `src/app/(tabs)/index.tsx` show `profile?.full_name ?? ''` instead of the first word.
- [ ] **Step 7: Verify** on web at phone size with the existing etkinlik admin form: it scrolls to the last field. Screenshot to `screenshots/09-feedback/01-foundations/`. Keyboard overlap is rechecked on a phone at hand-off.
- [ ] **Step 8: Commit** `feat: keyboard-safe Screen, singleFlight helper, full-name welcome`.

### Task 2: Push diagnosis (independent; start early so the user can do Firebase steps in parallel)

**Files:**
- Modify: `src/lib/push.ts`, `src/app/admin/send-push.tsx`, possibly `app.json`
- Test: none (device behavior); verification by queries

**Interfaces:**
- Produces: `registerForPush(): Promise<{ ok: true } | { ok: false; reason: 'web' | 'simulator' | 'no-project-id' | 'permission-denied' | 'token-error'; detail?: string }>` (same behavior, now reports why it stopped; callers still ignore it silently, but it is logged with `console.warn`).

- [ ] **Step 1: Query** `push_tokens` (count, join profile) and invoke `send-push` as the test admin; record `sent`/`failed`. Write findings in the task's commit message.
- [ ] **Step 2: Change `registerForPush`** to return the result type above and wrap `getExpoPushTokenAsync` in try/catch (`token-error` with `detail`).
- [ ] **Step 3: In `send-push.tsx`** show the returned `sent`/`failed` counts, plus a hint when `sent` is 0 ("no registered devices").
- [ ] **Step 4: Report to the user** exactly which remaining step is theirs (e.g. `google-services.json`, `googleServicesFile` in `app.json`, FCM V1 key via `npx eas-cli credentials`, then a rebuild). Do not claim push works until a phone receives one.
- [ ] **Step 5: Commit** `fix: report why push registration stops`.

### Task 3: Talepler database (migration 0009)

**Files:**
- Create: `supabase/migrations/0009_talepler.sql`
- Modify: `supabase/tests/rls.sql`

**Interfaces:**
- Produces (schema): `listings` loses `price` and `photos`; gains `min_price numeric check (>= 0)`, `max_price numeric check (>= 0)`, `link text check (link is null or link ~* '^https?://')`, table check `min_price <= max_price` when both set; `rooms` becomes `text[] not null default '{}'`. `similar_listings(p_listing_id uuid, p_limit int default 5)` is replaced: same type required; neighborhood +3; district +2; price ranges overlap +2 (only if the source has at least one bound; a null bound means open-ended); any shared room +1; area within 20% +1; at least 3 points. The `listing-photos` bucket, its objects and policies are removed.

- [ ] **Step 1: Add assertions to `rls.sql`:** insert two talepler (ranges 5M–8M and 7M–10M, same type/district) → `similar_listings` returns the second; a talep with only `min_price` and one with neither insert fine; `min_price 9, max_price 5` insert fails.
- [ ] **Step 2: Run the test** against the DB — expect failure (columns missing).
- [ ] **Step 3: Write the migration:** `delete from public.listings`; alter columns; new `similar_listings`; drop `listing-photos` policies, objects, bucket.
- [ ] **Step 4: Apply, re-run `rls.sql`** — expect the `RLS TESTS PASSED` exception message.
- [ ] **Step 5: Commit** `feat(db): talepler price range, link, multi-room, no photos`.

### Task 4: Talep pure logic (filters, price, link)

**Files:**
- Modify: `src/lib/listingFilters.ts`, `src/lib/listingFilters.test.ts`, `src/lib/types.ts`
- Create: `src/lib/links.ts`, `src/lib/links.test.ts`

**Interfaces:**
- Consumes: schema from Task 3.
- Produces: `ListingFilters.rooms?: string[]` (replaces `rooms?: string`); `applyListingFilters` now: rooms → `.overlaps('rooms', rooms)`, price → rows whose range overlaps the filter range via `.or(...)` treating null bounds as open (extend the `Chainable` type with `overlaps` and `or`). `parsePriceInput(input: string): number | null` ("5.000.000" and "5000000" → 5000000; blank or non-numeric → null). `parseLink(input: string): { ok: true; url: string | null } | { ok: false }` — blank → `{ok:true,url:null}`; adds `https://` when no scheme; only `http`/`https` with a dotted host accepted; `javascript:` and similar rejected. `Listing` type: remove `price`/`photos`, add `min_price`, `max_price`, `link`, `rooms: string[]`.

- [ ] **Step 1: Write failing tests:** `parsePriceInput('5.000.000') === 5000000`, `('') === null`, `('abc') === null`; `parseLink('aneder.org')` → `{ok:true,url:'https://aneder.org'}`, `parseLink('')` → `{ok:true,url:null}`, `parseLink('javascript:alert(1)')` → `{ok:false}`, `parseLink('http://x')` → `{ok:false}` (no dotted host); recorder test: filters `{rooms:['2+1','3+1']}` call `overlaps('rooms',[...])`; `{minPrice:5e6}` produces one `or` call mentioning `max_price.is.null` and `max_price.gte.5000000`.
- [ ] **Step 2: Run** `npx jest src/lib` — expect FAIL.
- [ ] **Step 3: Implement** the changes above; update existing tests that assumed single `rooms` and `price` column.
- [ ] **Step 4: Run** `npx jest` — expect PASS.
- [ ] **Step 5: Commit** `feat: talep filters, price and link parsing`.

### Task 5: Talepler screens (rename, text only, range, link, rooms select-all)

**Files:**
- Move: `src/app/(tabs)/ilanlar/` → `src/app/(tabs)/talepler/` (`git mv`; update `_layout`, tab name and typed routes)
- Modify: `src/app/(tabs)/talepler/{index,[id],form}.tsx`, `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/index.tsx`, `src/components/ListingCard.tsx`, `src/i18n/tr.ts`, `src/lib/photos.ts`, `supabase/functions/delete-account/index.ts`, `app.json`
- Modify: `README.md`/docs mentions only where they name the tab

**Interfaces:**
- Consumes: Task 4 helpers; `ROOM_OPTIONS` from `src/lib/districts.ts`; `singleFlight` (Task 1).
- Produces: route base `/talepler`; i18n group `t.talepler` (rename of `t.listings`); form submit wrapped in `singleFlight`.

- [ ] **Step 1: Rename** the folder, tab title "Talepler", all copy ("İlan" → "Talep", "İlan ver" → "Talep ekle" etc.), and every `/ilanlar` href in the app (grep for `ilanlar`).
- [ ] **Step 2: Form:** remove photo UI; add min and max price fields (numeric, optional, show formatted), a link field (error text on invalid via `parseLink`), rooms as multi-select chips with a "Tümünü seç" chip that selects all, tapping it again clears. Reject min > max with a message. Keep all other buttons/labels.
- [ ] **Step 3: List/detail/card:** show the range ("5.000.000 – 8.000.000 ₺", "En az …", "En çok …"; hide when both empty), the link as a tappable row (`expo-web-browser`), rooms joined by ", "; filter UI uses rooms as multi-select and min/max.
- [ ] **Step 4: Delete listing-photo code** from `photos.ts` (`removeListingPhotos`, `uploadListingPhoto`, `signedUrls`, the bucket const); keep `pickImages`. In `delete-account` remove the storage purge loop and `photosPurged`. Update `app.json` `photosPermission` to cover event photos only.
- [ ] **Step 5: Verify:** `npx tsc --noEmit`, `npx expo lint`, `npx jest`; web screenshots of form (with Tümünü seç), list, detail, similar to `screenshots/09-feedback/05-talepler/`.
- [ ] **Step 6: Commit** `feat: İlanlar become text-only Talepler`.

### Task 6: Profil — read-only profile, edit mode, own talepler

**Files:**
- Modify: `src/app/(tabs)/profil/index.tsx`, `src/i18n/tr.ts`, `src/lib/types.ts`
- Create: `src/app/(tabs)/profil/edit.tsx`

**Interfaces:**
- Consumes: `Profile` (gains `title` in Task 8; render it only if present), talep form route `/talepler/form?id=…`.
- Produces: profile view (name, title label if any, phone, firms summary, "Taleplerim" list with Düzenle/Sil, QR button placeholder wired in Task 14, admin section for admins); edit moves to `profil/edit` (name, phone) with a save that is `singleFlight`-guarded; existing sign-out/delete-account/firms links remain.

- [ ] **Step 1: Build the read-only view** with the existing visual language and an "Düzenle" button opening `profil/edit`.
- [ ] **Step 2: Taleplerim:** query `listings` by `owner_id`, newest first; edit opens the Task 5 form prefilled; delete uses `confirm`.
- [ ] **Step 3: Verify** typecheck/lint, web screenshots to `screenshots/09-feedback/06-profil/`; saving name still updates the welcome on Anasayfa.
- [ ] **Step 4: Commit** `feat: read-only profile with edit mode and own talepler`.

### Task 7: Etkinlik — date/time picker, multiple photos, no double post, share

**Files:**
- Create: `supabase/migrations/0010_event_photos.sql`, `src/components/DateTimeField.tsx`, `src/components/PhotoCarousel.tsx`, `src/lib/eventPhotos.ts`, `src/lib/share.ts`, `src/lib/share.test.ts`
- Modify: `src/app/admin/events.tsx`, `src/app/(tabs)/etkinlikler/[id].tsx`, `src/components/EventCard.tsx`, `src/lib/dates.ts`, `src/lib/dates.test.ts`, `src/lib/types.ts`, `src/i18n/tr.ts`, `supabase/tests/rls.sql`

**Interfaces:**
- Produces: table `event_photos(id uuid pk, event_id uuid references events on delete cascade, url text not null, position int not null, created_at)`; members read (approved), admins write; max 10 per event (check in a trigger or policy). `events.cover_url` stays and is set to the first photo on save (cards unchanged). `DateTimeField({ label: string; value: Date | null; onChange: (d: Date) => void; minimumDate?: Date })` — wheel/calendar-style date and time pickers per SDK 58 docs, must also render on web. `PhotoCarousel({ urls: string[] })` — horizontal paging with dots, 16:9. `uploadEventPhotos(images: PickedImage[]): Promise<string[]>` (loops existing `uploadCover`). `buildEventShareText(e: { title: string; starts_at: string; location: string | null; description: string | null }): string` and `shareEvent(e): Promise<void>` using RN `Share`; text ends with `SITE_URL = 'https://www.aneder.org/'`.

- [ ] **Step 1: RLS tests** for `event_photos`: pending/anon read nothing, approved reads, member insert fails, admin insert works, 11th photo fails.
- [ ] **Step 2: Write `share.test.ts`:** text contains title, formatted date/time, location when present, omits missing parts without "null", and ends with the site URL.
- [ ] **Step 3: Run** the SQL and jest tests — expect FAIL.
- [ ] **Step 4: Apply migration; implement** `share.ts` (use `formatTrDateTime`). Remove `parseTrDateTime` and its tests (now unused).
- [ ] **Step 5: Admin events form:** `DateTimeField` replaces the typed date (reject past dates only with a warning, not a block — admins may log past events); multiple photos (add up to 10, remove individually, first = cover); wrap `submit` in `singleFlight` and disable the button while busy; find the real cause of the reported double post (check for a second handler/remount) and note it in the commit.
- [ ] **Step 6: Detail screen:** `PhotoCarousel` from `event_photos` (fallback to `cover_url`), a "Paylaş" button calling `shareEvent`.
- [ ] **Step 7: Verify** lint/tsc/jest, web screenshots to `screenshots/09-feedback/07-etkinlik/` (picker, carousel). Swipe feel and share sheet are checked on a phone.
- [ ] **Step 8: Commit** `feat: etkinlik picker, multi-photo carousel, share, single submit`.

### Task 8: Roles and titles (migration 0011)

**Files:**
- Create: `supabase/migrations/0011_roles_titles.sql`, `src/lib/titles.ts`, `src/components/TitleLabel.tsx`
- Modify: `supabase/tests/rls.sql`, `src/lib/types.ts`, `src/app/admin/members.tsx`, `src/app/(tabs)/uyeler/index.tsx`, `src/app/(tabs)/uyeler/[id].tsx`, `src/app/(tabs)/profil/index.tsx`, `src/i18n/tr.ts`

**Interfaces:**
- Produces: `profiles.role` check allows `member | admin | scanner`; `profiles.title text` (max 60 chars); `guard_profile_columns()` also blocks non-admin changes to `title`; `public.can_scan() returns boolean` (approved and role in `admin`, `scanner`; security definer, executable by authenticated). `Profile.role: 'member' | 'admin' | 'scanner'`, `Profile.title: string | null`. `TITLE_SUGGESTIONS: readonly string[]` = Başkan, Başkan Yardımcısı, Genel Sekreter, Sayman, Yönetim Kurulu Üyesi, Denetçi.

- [ ] **Step 1: RLS tests:** a member updating own `title` or `role` fails; an admin setting `title` and `role='scanner'` works; `can_scan()` true for admin and scanner, false for member and pending scanner.
- [ ] **Step 2: Run** — expect FAIL. **Step 3: Write and apply the migration; re-run** — expect pass.
- [ ] **Step 4: Admin members screen:** below the pending list add an approved-members list; each row has role chips (Üye / Tarayıcı / Yönetici) and a title field with suggestion chips; saving is `singleFlight`-guarded; an admin cannot demote themselves (button disabled with a hint).
- [ ] **Step 5: Show titles:** `TitleLabel` under names in Üyeler list, member detail, and Profil.
- [ ] **Step 6: Verify** lint/tsc/jest, screenshots to `screenshots/09-feedback/08-titles/`.
- [ ] **Step 7: Commit** `feat: member titles and scanner role`.

### Task 9: Hakkımızda

**Files:**
- Create: `src/app/(tabs)/uyeler/hakkimizda/index.tsx`, `src/app/(tabs)/uyeler/hakkimizda/[key].tsx`
- Modify: `src/app/(tabs)/uyeler/index.tsx`, `src/app/(tabs)/uyeler/_layout.tsx` (if the stack needs the screens registered), `src/i18n/tr.ts`

**Interfaces:**
- Produces: `t.about = { entry, president: { title, body }, association: { title, body } }` with clearly marked placeholder Turkish text ("Şablon metin — gerçek içerik sağlanacak"); route keys `baskan-mesaji` and `hakkimizda`.

- [ ] **Step 1: Add a "Hakkımızda" entry** at the top of the Üyeler screen (visible even while searching).
- [ ] **Step 2: Index screen** with two labeled rows; `[key]` screen renders the title and body (unknown key → back).
- [ ] **Step 3: Verify** lint/tsc, screenshots to `screenshots/09-feedback/09-about/`.
- [ ] **Step 4: Commit** `feat: Hakkımızda with president message and about pages`.

### Task 10: Auth — forgot password and legal consent (migration 0012)

**Files:**
- Create: `supabase/migrations/0012_signup_consent.sql`, `src/app/(auth)/forgot.tsx`, `src/app/(auth)/reset.tsx`, `src/app/(auth)/kullanim-sartlari.tsx`, `src/app/(auth)/aydinlatma.tsx`
- Modify: `src/app/(auth)/login.tsx`, `src/app/(auth)/register.tsx`, `src/app/_layout.tsx` (recovery deep link handling), `src/i18n/tr.ts`, `supabase/tests/rls.sql`

**Interfaces:**
- Produces: `profiles.terms_accepted_at timestamptz` and `profiles.email_consent boolean not null default false`, set by `handle_new_user()` from signup metadata keys `terms_accepted` and `email_consent`. Register requires the checkbox (text covers Kullanım Şartları, Aydınlatma Metni and receiving ANEDER etkinlik/duyuru emails, with both documents linked); submit blocked until ticked. Forgot flow: `supabase.auth.resetPasswordForEmail(email, { redirectTo })` with `redirectTo` from `Linking.createURL('/reset')`; `reset.tsx` handles the recovery session (per current Supabase docs for `PASSWORD_RECOVERY`/code exchange) and calls `supabase.auth.updateUser({ password })` with the same password rules as register.

- [ ] **Step 1: RLS test:** a user created with metadata `terms_accepted=true` gets `terms_accepted_at` not null and `email_consent` true; without it both are unset/false.
- [ ] **Step 2: Run** — FAIL; **apply migration, re-run** — pass.
- [ ] **Step 3: Legal pages** with placeholder text; **register checkbox**; **forgot and reset screens**; "Şifremi unuttum" link on login.
- [ ] **Step 4: Give the user** the exact Supabase Auth redirect URLs to allowlist (`anader://reset` and the dev/web equivalents); the flow is verified by hand on a build after they do. Web screenshots cover the forms only.
- [ ] **Step 5: Commit** `feat: forgot password and signup legal consent`.

### Task 11: Publishing — send-email function and notify helper

**Files:**
- Create: `supabase/functions/send-email/index.ts`, `src/lib/notify.ts`, `src/lib/notify.test.ts`
- Modify: `src/app/admin/announcements.tsx`, `src/app/admin/events.tsx`, `src/i18n/tr.ts`

**Interfaces:**
- Produces: Edge Function `send-email` — admin-only (same auth check as `send-push`), body `{ subject: string; text: string }`; reads approved members' emails from `auth.users` with the service role; sends one message per member via Resend's batch endpoint from `MAIL_FROM` (default `ANEDER <info@aneder.org>`), secret `RESEND_API_KEY`; text-only body plus footer "ANEDER üye bilgilendirmesi"; returns `{ sent: number; failed: number }`. Client: `publish(opts: { title: string; body: string; eventId?: string; push: boolean; email: boolean }): Promise<{ push: { sent: number; failed: number } | null; email: { sent: number; failed: number } | null; errors: string[] }>` — never throws; each channel's failure becomes an entry in `errors`.

- [ ] **Step 1: Write `notify.test.ts`** with a stubbed `supabase.functions.invoke`: both channels on → two invokes; push rejects → result still has email data and one error; both off → no invokes; `eventId` is passed to push only.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement** `notify.ts`; **Step 4: run** — PASS.
- [ ] **Step 5: Write `send-email`**; set the secret (user provides the Resend key; use the sandbox sender meanwhile); deploy.
- [ ] **Step 6: Wire both admin forms:** two switches "Bildirim gönder" and "E-posta gönder", both on by default, shown on create only; after the row is saved call `publish`, then show a result line (sent counts or the failure message) without removing the saved post. Replace the existing single `notify` switch in events; add the same to duyurular (including `singleFlight` on its submit).
- [ ] **Step 7: Verify** by invoking `send-email` as the test admin with the sandbox sender and reading `{sent, failed}`; screenshots of both forms to `screenshots/09-feedback/11-publish/`.
- [ ] **Step 8: Commit** `feat: email and push toggles when publishing`.

### Task 12: Üyelere Özel (migration 0013)

**Files:**
- Create: `supabase/migrations/0013_offers.sql`, `src/app/admin/offers.tsx`, `src/components/OfferCard.tsx`
- Modify: `src/app/(tabs)/index.tsx`, the admin menu (find where `admin/announcements` is linked), `src/lib/types.ts`, `src/i18n/tr.ts`, `supabase/tests/rls.sql`

**Interfaces:**
- Produces: table `offers(id uuid pk, sponsor text not null, title text not null, description text, link text check http(s), valid_until date, created_by uuid default auth.uid(), created_at)`, RLS like `announcements` (approved read, admin write). Type `Offer`. Home section "Üyelere Özel" lists offers where `valid_until is null or valid_until >= current_date`, newest first, hidden when empty; link opens in `expo-web-browser`.

- [ ] **Step 1: RLS tests:** pending reads none, approved reads, member insert fails, admin insert/update/delete works.
- [ ] **Step 2: Run** — FAIL; **apply migration, re-run** — pass.
- [ ] **Step 3: Admin screen** (list + create/edit/delete, `singleFlight`, link via `parseLink`) and **home section**.
- [ ] **Step 4: Verify** lint/tsc/jest, screenshots to `screenshots/09-feedback/12-offers/`.
- [ ] **Step 5: Commit** `feat: Üyelere Özel sponsor offers`.

### Task 13: QR database (migration 0014)

**Files:**
- Create: `supabase/migrations/0014_qr_checkin.sql`
- Modify: `supabase/tests/rls.sql`

**Interfaces:**
- Produces: table `qr_tokens(token text pk, user_id uuid references profiles on delete cascade, expires_at timestamptz not null, used_at timestamptz)` with RLS on and no policies (RPC-only). Table `event_checkins(event_id uuid references events on delete cascade, member_id uuid references profiles on delete cascade, checked_in_at timestamptz default now(), checked_in_by uuid, primary key (event_id, member_id))`; select/delete for admins only, no direct insert. RPCs (security definer, authenticated only): `issue_qr_token() returns text` — requires approved, token valid 90 seconds, deletes the caller's expired tokens; `check_in(p_event_id uuid, p_token text) returns jsonb` — raises `insufficient_privilege` unless `can_scan()`; returns `{"status":"ok","member_name":text}` on success, `{"status":"already","member_name":text}` if that member is already checked in for the event, `{"status":"invalid"}` for unknown, expired, used, or non-approved-member tokens; marks the token used. `remove_check_in(p_event_id uuid, p_member_id uuid) returns void` — admin only.

- [ ] **Step 1: Write RLS tests:** approved member gets a token; scanner `check_in` → ok then, with a fresh token, `already`; reusing a used token → `invalid`; expired token (set `expires_at` in the past) → `invalid`; token of a pending member → `invalid`; a plain member calling `check_in` raises; plain member cannot select `event_checkins`/`qr_tokens`; admin can select and `remove_check_in`.
- [ ] **Step 2: Run** — FAIL. **Step 3: Write and apply the migration; re-run** — pass.
- [ ] **Step 4: Commit** `feat(db): single-use QR tokens and event check-ins`.

### Task 14: QR screens — member QR, scanner, attendance list

**Files:**
- Create: `src/lib/qr.ts`, `src/lib/qr.test.ts`, `src/app/(tabs)/profil/qr.tsx`, `src/app/scan.tsx`, `src/app/admin/attendance.tsx`
- Modify: `app.json` (expo-camera plugin with Turkish `cameraPermission`), `src/app/(tabs)/profil/index.tsx`, `src/app/_layout.tsx` (register `scan`), admin menu, `src/i18n/tr.ts`, `package.json` (via `npx expo install expo-camera react-native-svg react-native-qrcode-svg`)

**Interfaces:**
- Consumes: RPCs from Task 13; `can_scan()` result via `profile.role` in `['admin','scanner']`.
- Produces: `buildQrPayload(token: string): string` returns `anader:qr:<token>`; `parseQrPayload(raw: string): string | null` returns the token or null for anything else (including empty token, extra segments, other schemes).

- [ ] **Step 1: Write `qr.test.ts`:** round trip; `parseQrPayload('https://x')`, `('anader:qr:')`, `('anader:qr:a:b')`, `('')` → null.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement**; **Step 4: run** — PASS.
- [ ] **Step 5: `profil/qr.tsx`:** button "QR Kodum" in Profil opens it; fetches a token via `issue_qr_token`, shows the QR, refreshes every 60 seconds while focused, shows a clear error when offline.
- [ ] **Step 6: `scan.tsx`:** entry "QR Tara" in Profil for scanner/admin only; etkinlik picker (default nearest upcoming-or-today); `CameraView` barcode scanning (qr only) per SDK 58 `expo-camera` docs; one scan in flight at a time (use `singleFlight`, with a short cooldown after each result); show large result states: ok (member name), already, invalid, error. Web fallback: a text field to paste the payload so the flow is testable in screenshots.
- [ ] **Step 7: `admin/attendance.tsx`:** pick an etkinlik, list check-ins (name, time, count), remove a mistaken one with `confirm` → `remove_check_in`.
- [ ] **Step 8: Verify** lint/tsc/jest, web screenshots (QR image, paste-scan result states, attendance) to `screenshots/09-feedback/14-qr/`. Camera scanning is checked by hand on a build.
- [ ] **Step 9: Commit** `feat: member QR, scanner and attendance list`.

### Task 15: Final pass

**Files:**
- Modify: `README.md`, `docs/RELEASING.md`

- [ ] **Step 1:** grep the repo for `ilan` / `İlan` / `ilanlar` leftovers and fix any.
- [ ] **Step 2:** run lint, tsc, jest and `rls.sql` once more; confirm all pass.
- [ ] **Step 3:** update README/RELEASING (new migrations to apply, Resend secret, `MAIL_FROM`, Auth redirect URLs, new native deps needing a fresh EAS build, camera permission, push credentials status).
- [ ] **Step 4:** hand the user a short checklist of what must be tested by hand on a phone (keyboard, push, email, QR, forgot password link).
- [ ] **Step 5: Commit** `docs: update guides for feedback round 1`.
