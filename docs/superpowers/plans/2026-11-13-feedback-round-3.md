# Feedback Round 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (the user chose native/inline execution) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Sektörden Haberler, Al/Ver Talepler with matching and recommendations, date of birth with a birthday celebration, a Kurumsal hub (Hakkımızda, Vizyon, Misyon, Başkan Mesajı, Eğitimler), draft legal pages and an in-app e-mail switch.

**Architecture:** New Supabase tables/columns/functions in four additive migrations (0018–0021); client logic as small tested helpers in `src/lib`; new pushed screens (`haberler`, `kurumsal`, `yasal`) outside the tab bar so it stays at 5 tabs; admin editing through new `admin/*` screens using the existing form-first pattern.

**Tech Stack:** Expo SDK 58 + expo-router (typed routes: regenerate by briefly running `npx expo start --web`), Supabase (Postgres RLS, RPC), Jest, Playwright (browser checks with a mocked backend).

**Spec:** `docs/superpowers/specs/2026-11-13-feedback-round-3-design.md`

## Global Constraints

- UI strings are Turkish and live in `src/i18n/tr.ts` (`t.*`); no hard-coded copy in screens.
- Use design tokens and shared components (`src/theme.ts`, `src/components/ui.tsx`, `design-system/MASTER.md`); Ionicons only, no emoji as icons; touch targets ≥ 44pt; status never by color alone.
- Tab bar stays at 5 tabs. New pages are top-level pushed screens guarded for approved members.
- Supabase MCP is disconnected: **migrations cannot be applied by the agent.** Write them, keep them additive, and list them for Gökberk to run in order 0018 → 0021. Never claim a DB behavior is verified without a database.
- Before declaring a task done: `npx tsc --noEmit` and `npx jest` are green (lint is not configured).
- Birth dates must never be readable by other members: stored only in `profile_private`.
- Do not use subagents (user preference); one fresh whole-branch self-review at the end.
- Windows: use the Write/Edit tools, not bash heredocs, for files with special characters; `git push` only from Git Bash and only when asked.

## Review Focus

Input classes the spec implies but no single task's tests would cover:

1. A post with a null `district` must never match anything (SQL test + UI shows no matches, not an error).
2. A member with no posts opens "Önerilenler": a hint, not an empty blank or an error.
3. A member with no `profile_private` row (every existing member) loads Home and Profil → Düzenle without errors.
4. Feb 29 birthdays on non-leap years; birth date today vs. yesterday/tomorrow at midnight boundaries.
5. Haberler without a photo, with a very long title/text; trainings with no link and no note; invalid links rejected.

---

### Task 1: Listing sides in the database

**Files:**
- Create: `supabase/migrations/0018_listing_sides.sql`
- Modify: `supabase/tests/rls.sql` (append a block)

**Interfaces:**
- Produces: column `listings.side` (`'al' | 'ver'`, default `'al'`); `public.match_score(a public.listings, b public.listings) returns int` (null = no match, else 0–6); `public.matching_listings(p_listing_id uuid, p_limit int default 10) returns setof public.listings`; `public.my_recommendations(p_limit int default 50) returns setof public.listings`; `similar_listings` now same-side only.

- [ ] **Step 1: Write the SQL test block first** (appended to `rls.sql`, in the existing `do $$ … raise exception 'X TESTS PASSED'` style, using the helper pattern already in that file for creating approved members and setting `request.jwt.claims`). Assertions, with the data shown:
  - al(satilik, Çankaya, 4–6M, rooms {3+1}, neighborhood Kızılay) vs ver(satilik, Çankaya, 5M–5M, rooms {3+1,2+1}, Kızılay): `match_score` is not null and = 6 (3+2+1 with area 130 vs 135).
  - different `type` → null; different `district` → null; either `district` null → null; price ranges not overlapping → null; same `side` → null.
  - open-ended price (`min_price`/`max_price` null on one side) still matches on type+district.
  - `matching_listings(al_id)` returns only the opposite-side matches, best score first, never the post itself.
  - `my_recommendations()` as member A returns ver posts that match A's al posts, excludes A's own posts, and orders by best score; as a member with no posts returns zero rows.
  - `similar_listings(al_id)` returns only `side = 'al'` posts.
- [ ] **Step 2: Implement `0018_listing_sides.sql`.**
  - `alter table public.listings add column side text not null default 'al' check (side in ('al','ver'));` and `create index listings_side_idx on public.listings (side, type, district);`
  - `match_score` (`language sql immutable set search_path = ''`): returns null unless `a.side <> b.side and a.type = b.type and a.district is not null and a.district = b.district` and price ranges overlap with open-ended bounds (`coalesce(b.max_price,'Infinity') >= coalesce(a.min_price,0) and coalesce(b.min_price,0) <= coalesce(a.max_price,'Infinity')`); otherwise `(neighborhood_norm equal and <> '' → 3) + (rooms overlap, both non-empty → 2) + (area within 20% → 1)`.
  - `matching_listings`: `select l.* from listings l join listings s on s.id = p_listing_id cross join lateral (select match_score(s,l) score) m where m.score is not null and l.id <> s.id order by m.score desc, l.created_at desc limit p_limit` (`security invoker`).
  - `my_recommendations`: listings `l` with `l.owner_id <> auth.uid()` and `max(match_score(m, l))` over the caller's own posts `m` not null, ordered by that max desc then newest (`security invoker`, use `(select auth.uid())`).
  - `create or replace function public.similar_listings` with the existing 0009 body plus `and l.side = s.side`.
  - `revoke execute … from public, anon; grant execute … to authenticated;` for the two new functions.
- [ ] **Step 3: Verify.** No database is reachable: re-read the SQL against the test block line by line and note in the ledger `0018: written, NOT executed`. (Executed by Gökberk in the SQL editor; the test block is run then.)
- [ ] **Step 4: Commit** `feat(db): listing sides, matching and recommendation functions (0018)`.

---

### Task 2: Al/Ver client logic and forms

**Files:**
- Modify: `src/lib/types.ts` (Listing gets `side: 'al' | 'ver'`), `src/lib/listingFilters.ts`, `src/lib/listingFilters.test.ts`, `src/app/(tabs)/talepler/form.tsx`, `src/i18n/tr.ts`
- Test: `src/lib/listingFilters.test.ts`

**Interfaces:**
- Consumes: `applyListingFilters(query, filters)`, `normalizeFilters` from `listingFilters.ts`.
- Produces: `ListingFilters.side?: 'al' | 'ver'`; `applyListingFilters` adds `.eq('side', side)`; `normalizeFilters` keeps `side`; strings `t.listings.sideAl = 'Arıyorum'`, `sideVer = 'Sunuyorum'`, `badgeAl = 'Arıyor'`, `badgeVer = 'Sunuyor'`, `filterAl = 'Arayanlar'`, `filterVer = 'Sunanlar'`, `recommended = 'Önerilenler'`, `matches = 'Eşleşenler'`, `noMatches`, `noPostsHint`, `kindQuestion = 'Ne yapmak istiyorsunuz?'`.

- [ ] **Step 1: Failing tests** in `listingFilters.test.ts`: `normalizeFilters({side:'ver'})` keeps `side`; `applyListingFilters(q, {side:'al'})` records `['eq','side','al']`; no `side` → no `eq('side')` call.
- [ ] **Step 2: Run** `npx jest src/lib/listingFilters.test.ts` → fails.
- [ ] **Step 3: Implement** the filter change and the new `Listing.side` field; run the test → passes.
- [ ] **Step 4: Form.** In `form.tsx` add a `side` state (default `'al'`, loaded from the post when editing) with two large selectable options at the top labelled `t.listings.sideAl` / `t.listings.sideVer` under `t.listings.kindQuestion`; include `side` in the saved row. Same fields for both sides (spec). Editing keeps the post's side.
- [ ] **Step 5: Verify** `npx tsc --noEmit`, `npx jest` green. Commit `feat: al/ver side in talep logic and form`.

---

### Task 3: Talepler list, cards and detail (sides, matches, Önerilenler)

**Files:**
- Modify: `src/app/(tabs)/talepler/index.tsx`, `src/app/(tabs)/talepler/[id].tsx`, `src/components/ListingCard.tsx`, `src/i18n/tr.ts`

**Interfaces:**
- Consumes: `ListingFilters.side`, `applyListingFilters`, RPCs `matching_listings(p_listing_id, p_limit)` and `my_recommendations(p_limit)` (return `Listing[]`, already ranked), `Badge`, `Chip`, `EmptyState` from `ui.tsx`.

- [ ] **Step 1: List.** Add a side switch row (chips: `t.listings.all`, `t.listings.filterAl`, `t.listings.filterVer`) setting `filters.side`, and an `t.listings.recommended` chip. In recommended mode load `applyListingFilters(supabase.rpc('my_recommendations', { p_limit: 50 }), filters)` **without** an extra `.order` (the function ranks); show `EmptyState` with `t.listings.noPostsHint` when it returns nothing and the member has no posts of their own. Normal mode unchanged plus the `side` filter. The "clear" action resets side/recommended too; the active-filter count includes them.
- [ ] **Step 2: Card.** `ListingCard` shows a second `Badge` for the side (`badgeAl` neutral tone, `badgeVer` brand tone) next to the Satılık/Kiralık badge; text, not color alone.
- [ ] **Step 3: Detail.** In `[id].tsx` replace the single similar fetch with two: `matching_listings(p_listing_id: l.id)` rendered first under `t.listings.matches` (own posts only see matches of the opposite side; the function already guarantees it), then `similar_listings` under the existing "Benzer talepler" title. Empty matches show a one-line `t.listings.noMatches`, not an error; a failing RPC (migration not yet applied) shows nothing instead of crashing.
- [ ] **Step 4: Verify** tsc + jest green; real-screen check happens in Task 8. Commit `feat: talepler side switch, recommendations and matches`.

---

### Task 4: Sektörden Haberler

**Files:**
- Create: `supabase/migrations/0019_news.sql`, `src/components/NewsCard.tsx`, `src/app/haberler/_layout.tsx`, `src/app/haberler/index.tsx`, `src/app/haberler/[id].tsx`, `src/app/admin/news.tsx`
- Modify: `src/lib/types.ts` (`NewsItem`), `src/app/_layout.tsx` (register + allow `haberler`), `src/app/admin/_layout.tsx`, `src/app/(tabs)/index.tsx` (home section), `src/app/(tabs)/profil/index.tsx` (admin row), `src/i18n/tr.ts`

**Interfaces:**
- Produces: table `news(id uuid pk, title text not null, body text not null, image_url text, created_by uuid default auth.uid(), created_at)`; type `NewsItem = { id; title; body; image_url: string | null; created_at }`; `<NewsCard item onPress?>`; routes `/haberler`, `/haberler/[id]`, `/admin/news`.
- Consumes: `uploadCover(image)` and `pickImages(1)` (as in `admin/offers.tsx`), `PublishToggles`, `publish()` / `describePublish()` from `notify.ts`, `singleFlight`, `Screen scrollRef`.

- [ ] **Step 1: Migration `0019_news.sql`**: table, `enable row level security`, policies: select `to authenticated using (public.is_approved())`; insert/update/delete `public.is_admin()`; index on `created_at desc`. Append an SQL test block (member reads, member cannot insert, admin can; pending member cannot read).
- [ ] **Step 2: Types + strings** (`t.news.title = 'Sektörden Haberler'`, `all`, `empty`, `manage`, `titleField`, `bodyField`, `photo`, etc.).
- [ ] **Step 3: Screens.** `NewsCard`: optional 16:9 photo, date, title, 3-line body preview. `haberler/index`: skeleton → list → `EmptyState`; `[id]`: full text + photo; `_layout`: Stack with `subScreenOptions('/')`-style header and back button. `admin/news`: form-first (title, body, one optional photo with remove, `PublishToggles` default push **on**, e-mail **off**), list below with edit/delete, edit scrolls to the form; publishing calls `publish({title, body: preview, push, email})` after the row is saved and reports via `describePublish`.
- [ ] **Step 4: Wiring.** Root layout: add `<Stack.Screen name="haberler" />` inside the `approved` Protected group and allow `segments[0] === 'haberler'` for approved members in `inAllowedArea`. Admin layout title; Profil admin menu row `t.news.manage`. Home: "Sektörden Haberler" `SectionHeader` with `action="Tümü"` and the latest 3 `NewsCard`s (skeleton while loading, `EmptyState` when none).
- [ ] **Step 5: Verify** tsc + jest; commit `feat: sektörden haberler (0019)`.

---

### Task 5: Kurumsal hub and Eğitimler

**Files:**
- Create: `supabase/migrations/0020_site_content.sql`, `src/lib/trainings.ts` + `src/lib/trainings.test.ts`, `src/app/kurumsal/_layout.tsx`, `src/app/kurumsal/index.tsx`, `src/app/kurumsal/[key].tsx`, `src/app/kurumsal/egitimler.tsx`, `src/app/admin/pages.tsx`, `src/app/admin/trainings.tsx`
- Modify: `src/lib/types.ts` (`SitePage`, `Training`), `src/app/_layout.tsx`, `src/app/admin/_layout.tsx`, `src/app/(tabs)/index.tsx` (tile), `src/app/(tabs)/profil/index.tsx`, `src/app/(tabs)/uyeler/index.tsx` and `src/app/(tabs)/uyeler/_layout.tsx` (remove the Hakkımızda entry/screens), `src/i18n/tr.ts`; Delete: `src/app/(tabs)/uyeler/hakkimizda/` (both files)

**Interfaces:**
- Produces: tables `site_pages(key text pk check in ('baskan-mesaji','hakkimizda','vizyon','misyon'), body text not null, updated_at timestamptz default now())` and `trainings(id uuid pk, title text not null, video_url text check null or ~* '^https?://', note text, position int not null default 0, created_at)`; `PAGE_KEYS` const array and `validateTraining(input: { title: string; videoUrl: string; note: string }): { ok: true; value: { title: string; video_url: string | null; note: string | null } } | { ok: false; error: 'title' | 'link' }` in `src/lib/trainings.ts`.
- Consumes: `parseLink(input)` from `links.ts` (returns `{ ok: true, url: string | null } | { ok: false }`).

- [ ] **Step 1: Failing tests** `trainings.test.ts`: title required (blank → `{ok:false,error:'title'}`); valid link kept (`https://youtu.be/x`); `ftp://x` or `not a link` → `{ok:false,error:'link'}`; blank link and blank note → `video_url: null, note: null`; trims title and note.
- [ ] **Step 2: Run → fail; implement `validateTraining` using `parseLink`; run → pass.**
- [ ] **Step 3: Migration `0020_site_content.sql`** (both tables, RLS: approved select, admin write) and an SQL test block (member reads, member cannot write, admin upserts a page and adds a training, invalid link rejected, unknown page key rejected).
- [ ] **Step 4: Content strings.** `t.corporate.*` for hub title and rows; template fallback texts: keep `t.about.president/association`, add `vizyon` and `misyon` templates ("Şablon metin: … yönetim tarafından sağlanacaktır."). `[key].tsx` loads `site_pages` by key (`maybeSingle`) and falls back to the template when there is no row or the request fails.
- [ ] **Step 5: Screens.** Hub (`ListGroup` of `ListRow`s: Başkan Mesajı, Hakkımızda, Vizyon, Misyon, Eğitimler). `egitimler`: `Card` per training (title, note, "Videoyu izle" `Button` with play icon opening the link via `Linking.openURL`; no button when no link), `EmptyState` when none. Admin `pages`: chip picker of the four pages + multiline body + save (upsert on `key`); admin `trainings`: form-first (title, link, note), list below with edit/delete, validated with `validateTraining`.
- [ ] **Step 6: Wiring.** Register `kurumsal` in the approved group and allow it in `inAllowedArea`; admin layout titles; Profil admin rows (`Kurumsal İçerik`, `Eğitimleri Yönet`); home tile "Kurumsal" in the quick-action row (4 tiles); remove Üyeler → Hakkımızda row, its routes and the `Stack.Screen` entries.
- [ ] **Step 7: Verify** tsc + jest; commit `feat: kurumsal hub, editable pages and eğitimler (0020)`.

---

### Task 6: Date of birth and birthday celebration

**Files:**
- Create: `supabase/migrations/0021_birth_date.sql`, `src/lib/birthday.ts` + `src/lib/birthday.test.ts`, `src/components/BirthdayCard.tsx`
- Modify: `src/components/DateTimeField.tsx` (date-only mode), `src/app/(auth)/register.tsx`, `src/app/(tabs)/profil/edit.tsx`, `src/app/(tabs)/index.tsx`, `src/i18n/tr.ts`

**Interfaces:**
- Produces (`birthday.ts`): `toBirthDateString(d: Date, now?: Date): string | null` → `'YYYY-MM-DD'` in local time, `null` if after `now` or before 1900-01-01; `isBirthdayToday(birthDate: string, now?: Date): boolean`; `firstName(fullName: string | null): string`. `DateTimeField` gains `mode?: 'datetime' | 'date'` (default `'datetime'`). `<BirthdayCard name />`.
- Table `profile_private(member_id uuid pk references profiles on delete cascade, birth_date date)`; signup metadata key `birth_date`.

- [ ] **Step 1: Failing tests** `birthday.test.ts`: `toBirthDateString(new Date(1990,4,7), now)` = `'1990-05-07'`; future date → null; `new Date(1899,11,31)` → null; today → valid. `isBirthdayToday('1990-05-07', new Date(2026,4,7,0,0,1))` true; `new Date(2026,4,6,23,59,59)` false; `new Date(2026,4,8,0,0,0)` false; `'2000-02-29'` is true on `2026-02-28` (non-leap) and false on `2026-03-01`, true on `2028-02-29` (leap) and false on `2028-02-28`; malformed string → false. `firstName('Ayşe Nur Demir')` = `'Ayşe'`; `firstName(null)` = `''`; trims.
- [ ] **Step 2: Run → fail; implement; run → pass.**
- [ ] **Step 3: Migration `0021_birth_date.sql`:** create `profile_private`, enable RLS, policies (select own or `public.is_admin()`; insert/update own with check `member_id = (select auth.uid())`); `create or replace function public.handle_new_user` (copy the 0015 body) that additionally inserts a `profile_private` row when `raw_user_meta_data ->> 'birth_date'` casts to a date between 1900-01-01 and today (wrap the cast so a bad value is ignored, never aborts signup). SQL test block: signup with valid date stores it; invalid/absent leaves no row; another member cannot read it; admin can.
- [ ] **Step 4: `DateTimeField` date-only mode:** web `input type="date"` (value `YYYY-MM-DD`), Android date dialog only, iOS date picker only; display `DD.MM.YYYY`; existing callers unchanged.
- [ ] **Step 5: Signup.** Required "Doğum tarihi" `DateTimeField mode="date"` below the phone field, validated with `toBirthDateString` (error string `t.auth.birthDateInvalid`); metadata gets `birth_date`.
- [ ] **Step 6: Profil → Düzenle.** Optional birth-date field: load own `profile_private` row (`maybeSingle`, missing row = empty), save with upsert on `member_id` (clearing stores null); errors use `t.common.error`.
- [ ] **Step 7: Celebration.** On Home (focus) fetch own `profile_private`; when `isBirthdayToday` render `BirthdayCard` above the greeting block: `Card` with primary tint, gift icon, "Doğum günün kutlu olsun, {firstName}!" plus a one-shot confetti burst of ~24 small `Animated` squares in brand/success/info colors (native driver, ~2.5 s), skipped when `AccessibilityInfo.isReduceMotionEnabled()`. Missing row or fetch failure shows nothing.
- [ ] **Step 8: Verify** tsc + jest; commit `feat: date of birth and birthday card (0021)`.

---

### Task 7: Legal pages and e-mail preferences

**Files:**
- Create: `src/i18n/legalTexts.ts` + `src/i18n/legalTexts.test.ts`, `src/app/yasal/_layout.tsx`, `src/app/yasal/[key].tsx`, `src/components/SwitchRow.tsx` (or add to `ui.tsx`)
- Modify: `src/app/_layout.tsx` (allow `yasal` for everyone), `src/app/(auth)/register.tsx`, `src/app/(tabs)/profil/index.tsx`, `supabase/functions/send-email/index.ts`, `src/i18n/tr.ts`; Delete: `src/app/(auth)/kullanim-sartlari.tsx`, `src/app/(auth)/aydinlatma.tsx` (and the old `t.legal.*` strings they used)

**Interfaces:**
- Produces: `LEGAL_PAGES: Record<'kullanim-sartlari' | 'aydinlatma' | 'acik-riza', { title: string; sections: { heading: string; body: string }[] }>`, `LEGAL_KEYS`, `LEGAL_DRAFT_NOTICE: string`; routes `/yasal/[key]`; `<SwitchRow label description value onValueChange disabled?>`.

- [ ] **Step 1: Failing test** `legalTexts.test.ts`: all three keys exist; each has a non-empty title and ≥ 4 sections; every heading/body is non-empty; the aydınlatma text mentions "6698" and "doğum tarihi"; the açık rıza text mentions "e-posta"; `LEGAL_DRAFT_NOTICE` is non-empty.
- [ ] **Step 2: Run → fail; write the Turkish draft texts** (data controller ANEDER, purposes incl. membership, event/duyuru/haber communication, birthday greeting; legal basis; recipients; storage; data-subject rights under KVKK m.11; contact info@aneder.org; açık rıza for e-posta and doğum günü; kullanım şartları basics). Every page begins with `LEGAL_DRAFT_NOTICE` ("Bu metin taslaktır; ANEDER hukuk danışmanı tarafından onaylanana kadar bağlayıcı değildir."). Run → pass.
- [ ] **Step 3: Route.** `yasal/[key].tsx` renders title, draft notice banner and sections (unknown key → redirect home); `yasal/_layout` Stack with back button (fallback `/`). Root layout: allow `segments[0] === 'yasal'` in every state, and register the screen outside the Protected groups.
- [ ] **Step 4: Signup consents.** Replace the single checkbox with (1) required: Kullanım Şartları + Aydınlatma Metni links (to `/yasal/...`), error `t.auth.consentRequired`; (2) optional, unchecked by default: "ANEDER'den etkinlik, duyuru ve haber e-postaları almak istiyorum" with an "Açık Rıza Metni" link; metadata `terms_accepted: true`, `email_consent: <checkbox 2>`.
- [ ] **Step 5: Profil.** Add `SwitchRow` "E-posta bildirimleri" (description: what is sent) bound to `profile.email_consent`; on change update `profiles.email_consent` for the own row, then `refreshProfile()`; on failure revert and show `t.common.error`. Add a "Yasal" `ListGroup` with three rows linking to `/yasal/...`.
- [ ] **Step 6: E-mail footer.** In `send-email/index.ts` extend `FOOTER` with a line: "E-posta almak istemiyorsanız uygulamada Profil → E-posta bildirimleri bölümünden kapatabilirsiniz." (Redeploy is a ledgered manual step.)
- [ ] **Step 7: Verify** tsc + jest; commit `feat: legal drafts, split consents, e-mail switch`.

---

### Task 8: Whole-feature verification, docs, final review

**Files:**
- Modify: `README.md` (setup checklist: run 0018–0021 in order, redeploy `send-email`, fill Kurumsal content), `docs/RELEASING.md` only if build steps changed (they do not)
- Create: `screenshots/round-4-haberler-talepler-kurumsal/{member,admin}/…`, `.superpowers/sdd/2026-11-13-feedback-round-3/progress.md` (ledger, git-ignored)

- [ ] **Step 1: Static checks:** `npx tsc --noEmit` and `npx jest` (all suites) green; regenerate typed routes first by briefly running `npx expo start --web`.
- [ ] **Step 2: Browser run as MEMBER and as ADMIN** (clean Playwright page per role, shared in-memory mock backend, 390px, `screenshots/…/member|admin/`), asserting at least:
  - Member: Home shows Kurumsal tile, Haberler section with items, no birthday card by default; birthday card appears when the mock date of birth is today; Talepler side switch filters Arayanlar/Sunanlar; "Önerilenler" shows matches and the hint for a member without posts; talep detail shows Eşleşenler; Kurumsal hub + each page (template fallback and saved text) + Eğitimler with "Videoyu izle"; Haberler list/detail without and with a photo; signup shows birth date + two checkboxes (blocked without required one, without birth date, with a future date); Profil e-posta switch toggles; `/yasal/*` readable; admin URLs blocked.
  - Admin: Profil admin menu lists the new rows; post a news item with and without a photo (form-first edit scrolls to the form); edit a Kurumsal page and see it in the hub; add/edit/delete a training with link validation; side badges and recommendations visible.
- [ ] **Step 3: Fix anything found**, re-run affected checks; keep only the final screenshot set (delete earlier loose ones).
- [ ] **Step 4: README checklist + ledger update.** List: manual migrations 0018→0021 (not applied by the agent), `send-email` redeploy, real texts for Kurumsal/legal, new build needed.
- [ ] **Step 5: Final self-review** of the whole diff against the spec and Review Focus (no fresh reviewer: subagents declined by the user), recorded in the ledger as `Final review: self-review`.
- [ ] **Step 6: Commit** `docs: round 3 verification screenshots and setup checklist`. Do not push unless asked.
