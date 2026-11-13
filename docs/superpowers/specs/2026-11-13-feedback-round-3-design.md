# ANEDER Mobile — feedback round 3: design

Date: 2026-11-13. Source: customer feedback relayed by Gökberk. Stack and conventions as in the earlier specs (Expo SDK 58, expo-router, Supabase, Turkish UI strings in `src/i18n/tr.ts`).

## Intent

ANEDER wants the app to feel like a professional association platform: industry news, a proper "corporate" area with training material, Talepler that work for both people looking for a property and people offering one (with recommendations), a personal touch (birthdays), and legal/email hygiene ahead of mass emailing.

## Goals

1. **Sektörden Haberler**: admins post industry news (title, text, one optional photo); members read it from the home screen.
2. **Talepler Al / Ver**: one tab handles seekers (Al) and offerers (Ver), with a side switch, proper filters, per-post matches, and a "recommended for me" mode.
3. **Date of birth** at signup; on their birthday the member sees a celebration on the home (welcome) screen.
4. **Kurumsal hub**: Hakkımızda, Vizyon, Misyon, Başkan Mesajı and Eğitimler (training videos + notes), moved out of Üyeler, editable by admins in the app.
5. **Legal/email**: draft KVKK Aydınlatma, Açık Rıza and Kullanım Şartları pages reachable from signup and Profil; an in-app e-mail on/off switch; unsubscribe wording ready for later.

## Non-goals

- Email unsubscribe link / website pages (blocked on website access; later).
- Real legal text (ANEDER's counsel provides it; ours are clearly marked drafts).
- Photos on Ver posts (decided: same fields as Al, no photos).
- A public "Bugün doğanlar" list (decided: celebration is private to the member).
- iOS/Apple work, Resend setup (unchanged open items).

## Anti-goals

- Birth dates readable by other members through the API.
- Ver posts silently showing up as seekers (or the reverse) because of old data.
- A tab bar with more than 5 tabs.

## Decisions by Gökberk

- One Talepler tab, two sides with a switch.
- Haberler: a section on the home screen plus its own screen; admins post.
- Kurumsal: one "Kurumsal" tile on home opening a hub screen; content admin-editable in the app.
- Birthday: required at signup, optional for existing members (Profil → Düzenle); only the member sees the celebration.
- Ver posts: same fields as Al, no photos.
- Matching: same type + same ilçe + price fits.
- Legal: mock KVKK + Aydınlatma + Kullanım Şartları, plus an in-app e-mail switch now.

## Calls I made (please check)

1. **Existing talepler become "Al"** (they were all "customer is looking" posts). New column `listings.side` with values `al` / `ver`, default `al`.
2. **Match rule.** For a post P, a match is a post of the *opposite* side with the same `type` (satılık/kiralık), the same non-null `district`, and an overlapping price range (a missing bound is open-ended, as today). Matches are ranked: same neighborhood +3, any shared room +2, area within 20% +1, then newest. No fuzzy/loose matching.
3. **"Benzer talepler" stays** but now only compares posts of the *same* side; a new "Eşleşenler" section (opposite side) sits above it on the detail page.
4. **"Önerilenler" filter** on the Talepler list = posts that match any of my own posts (database function `my_recommendations()`), best score first. It shows a hint when I have no posts yet.
5. **Labels.** Al = "Arıyorum / Arayanlar", Ver = "Sunuyorum / Sunanlar" (type stays Satılık/Kiralık). Tab keeps the name "Talepler" (your word). Cards show a text badge for the side (never color alone).
6. **Haberler** screens are pushed screens outside the tab bar (like the admin screens), reached from the home section and a header link. Posting uses the same publish toggles as Duyurular (push on, e-mail off by default since news is frequent).
7. **Birth date lives in a separate private table** (`profile_private`), readable only by the member and admins, because `profiles` rows are readable by every approved member. Valid date, not in the future, not before 1900. Feb 29 birthdays are celebrated on Feb 28 in non-leap years. "Today" is the phone's local date.
8. **Birthday celebration** = a card with a gift icon, the first name and a short confetti burst (skipped when the phone asks for reduced motion). No emoji as icons.
9. **Kurumsal pages** are rows in `site_pages` (hakkimizda, vizyon, misyon, baskan-mesaji) with the current template text as fallback until an admin saves real text. **Eğitimler** are rows in `trainings` (title, optional video link, optional note); the link opens in the browser/YouTube app. The old Üyeler → Hakkımızda entry and routes are removed.
10. **Legal pages move to a shared `/yasal/*` route** (today they sit in the logged-out group, so members could not open them in the app). Three drafts: Kullanım Şartları, KVKK Aydınlatma Metni, Açık Rıza Metni. Signup gets **two checkboxes**: required (terms + aydınlatma) and **optional** (e-mail notifications, açık rıza), replacing today's single bundled box that always set e-mail consent to true.
11. **In-app e-mail switch** in Profil toggles `profiles.email_consent` (members may already update their own row; role/status/title stay protected).
12. **E-mail footer** text gains one line telling members how to turn e-mails off in the app. The `send-email` function needs a redeploy for this (see Risks).

## Data model (new migrations 0018–0021)

- `0018_listing_sides`: `listings.side text not null default 'al' check in ('al','ver')`; index on `(side, type, district)`; `similar_listings` restricted to same side; new `matching_listings(p_listing_id, p_limit)` and `my_recommendations(p_limit)` (both `security invoker`, ranked as in call 2).
- `0019_news`: `news(id, title, body, image_url, created_by, created_at)`; approved members read; admins insert/update/delete. Photo uses the existing admin-write `covers` bucket.
- `0020_site_content`: `site_pages(key primary key, body, updated_at)` and `trainings(id, title, video_url, note, position, created_at)`; approved members read; admins write; link check `^https?://`.
- `0021_birth_date`: `profile_private(member_id primary key → profiles, birth_date date)`; select/insert/update own, select all for admins; `handle_new_user` also stores `birth_date` from signup metadata (invalid values ignored, never fail signup).

## Screens

- **Home**: tiles Kurumsal (new) next to QR / Talep Ekle / Üyeler; birthday card above the greeting block when it is the member's birthday; "Sektörden Haberler" section (latest 3 with thumbnail, "Tümü" link).
- **Haberler** list and detail (photo, text, date); admin screen to post/edit/delete with one photo and publish toggles; entry in the admin menu.
- **Talepler**: side switch (Tümü / Arayanlar / Sunanlar), type chips, "Önerilenler", existing filters (ilçe, mahalle, rooms, price). Add form starts with "Arıyorum / Sunuyorum". Detail shows Eşleşenler then Benzer.
- **Kurumsal hub**: Başkan Mesajı, Hakkımızda, Vizyon, Misyon, Eğitimler; page screen shows the text (template until edited); Eğitimler list with "Videoyu izle" and notes. Admin screens: edit the four texts; add/edit/delete trainings.
- **Signup**: date of birth (date-only picker), two consent checkboxes. **Profil → Düzenle**: optional date of birth. **Profil**: "E-posta bildirimleri" switch and a "Yasal" group (three pages).

## Testing

Unit tests (TDD): side/filter logic, birthday check (incl. Feb 29, month/day boundaries), date-of-birth validation, news/trainings link validation. Match ranking lives only in the database functions, so it is covered by SQL tests, not client code. SQL tests appended to `supabase/tests/rls.sql` for the new tables/functions (written now, run when a database connection is available). Browser check at phone width for every screen as **member and admin** with a mock backend, screenshots kept in `screenshots/`.

## Risks and open items

- **I cannot apply migrations** while the Supabase connection is down: Gökberk runs 0018–0021 in the SQL editor (they are additive and safe to re-run only once). New screens show an error until then.
- **`send-email` redeploy** (footer line) also needs the Supabase connection or Gökberk's CLI.
- Legal texts are drafts; ANEDER's counsel must replace them before real use.
- Training/news items need real content from ANEDER.
- The Talepler tab name may deserve a rename later now that it holds offers too.

## Left to the builder

Exact copy for button labels and the draft legal wording, and spacing/visual details within `design-system/MASTER.md`.
