# ANEDER Mobile — Feedback Round 1 Design

Date: 2026-11-09
Builds on: `2026-11-04-anader-mobile-design.md` (the original design; read it for users, accounts, stack).
Client: ANEDER (Ankara Emlakçılar Derneği). Builder: Gökberk.

## Intent

Testing with ANEDER produced a long list of changes. The common thread: the app should feel like a professional association tool, and İlanlar (property listings with photos) should become **Talepler**: short text requests ("looking for X") that agents post to find matching properties among each other. Admins also get stronger communication tools (email, notification, QR check-in) and a new place for sponsor offers.

The app is still in testing: no real members, no real data. Test data may be wiped and tables reshaped freely.

## Goals

1. Rename İlanlar to **Talepler**, make them text-only with a price range and an optional link, and let owners edit them from Profil.
2. Make event and announcement creation reliable and nicer (scrolling, keyboard, no double post, real date/time picker, multiple swipeable photos).
3. Let admins reach members through push notification **and** email when they post a duyuru or etkinlik.
4. Add Hakkımızda, Üyelere Özel, member titles, and a more professional read-only Profil.
5. Add forgot-password and legal consent (terms and aydınlatma metni) at signup.
6. Add QR check-in for etkinlikler with a new scanner permission.

## Non-goals

- Event pre-registration or ticketing (the QR is a member identity scanned at the door, not a ticket).
- A website or web admin (still a later project).
- Photos on Talepler (explicitly removed). Photos stay on etkinlikler (multiple) and duyurular (existing single cover).
- Email delivery tracking, unsubscribe management, or newsletters beyond duyuru/etkinlik emails.
- Real legal text, real president message, real About text: the user will provide these later. Build with clearly marked template text.

## Anti-goals

- A QR code that can be copied from a screenshot and reused later, or forged from a member id.
- Posting an etkinlik/duyuru failing or hanging because email or push failed. Sending is best-effort and reported after the post is saved.
- Titles accidentally granting permissions (or the reverse).
- Losing existing visual style: buttons and labels stay as they are unless stated.

## Decisions by the user

- "Ilan" → **Talep** everywhere (tab label, screens, text, routes). Buttons and labels otherwise unchanged.
- Talep: text only; add **minimum and maximum price** (used for similar-talep matching); add an optional **link**; rooms selector gets a **"Tümünü seç"** button.
- Welcome on Anasayfa shows **first name and surname**.
- Forms for duyuru/etkinlik must scroll and not be blocked by the keyboard; fix the **double post** on etkinlik.
- Duyuru gets a **send notification** option.
- Etkinlik date and time: a **table/wheel-style picker** instead of typing. Etkinlik supports **multiple photos**, swipeable left and right.
- Üyeler screen gets a **Hakkımızda** entry with two items, **Başkan Mesajı** and **Hakkımızda**; tapping opens a text page. Template text for now.
- Profil becomes **read-only by default** with an explicit edit action. Shows own talepler with edit.
- **Titles** (e.g. Başkan Yardımcısı) assigned by admins, shown as labels under names in Üyeler. Titles and permissions are separate: a title never grants permission.
- **Forgot password** (add if missing) and **terms + aydınlatma metni** at signup.
- Etkinlik can be **shared** via the phone's share sheet (message, WhatsApp, etc.).
- When an admin posts a duyuru or etkinlik, it is also **emailed to members**. Sender `info@aneder.org`.
- Anasayfa gets a **Üyelere Özel** section; admins enter sponsor offers.
- **QR for etkinlikler:** each member has a personal QR in Profil (a button generates it). A new account type, **scanner**, can scan QRs to mark attendance. Admins can scan too. (Confirmed flow: member shows QR → scanner scans → member recorded as attended for that etkinlik → admins can see the attendance list.)

## Builder's calls (not confirmed by the user)

- **Database names:** keep the table `listings` and existing column names where possible; the rename is UI/route level (`ilanlar` → `talepler`). Add `min_price`, `max_price`, `link`; drop `photos` and `price`. Purge the old listing photos from storage and make account deletion stop referencing them.
- **Link field on Talep:** any `http(s)` URL, validated (not Sahibinden-only).
- **Similar talepler** matching: price criterion becomes range overlap between the two talepler's min/max (replacing the ±20% band); other criteria (district, rooms, m²) unchanged.
- **Roles and titles:** `profiles.role` becomes `member | admin | scanner`. `profiles.title` is a free-text label set by admins (with a suggestion list: Başkan, Başkan Yardımcısı, Genel Sekreter, Sayman, Yönetim Kurulu Üyesi, Denetçi). Only admins can write either (extend the existing guard trigger). Scanner can scan but cannot access admin screens; admin implies scan ability.
- **Email:** an Edge Function `send-email` (admin only) using Resend (API key as a Supabase secret), sending one email per approved member (so addresses are not exposed to each other) from `info@aneder.org`. The domain is not yet verified with the provider, so real delivery cannot be tested until the user shares the domain; build and test with the provider's sandbox sender. Resend's free tier has daily/monthly limits; flag this to the user at hand-off.
- **Send toggles:** the duyuru and etkinlik forms get two toggles, "Bildirim gönder" and "E-posta gönder", both on by default. Sending runs after the row is saved; failures show a message but never undo the post. The existing standalone send-push screen stays.
- **Forgot password:** Supabase reset-password email with a deep link back into the app (`anader://`) to a set-new-password screen. Uses Supabase's default email sender until the custom SMTP is available.
- **Legal consent:** two static in-app text pages (Kullanım Şartları, Aydınlatma Metni) with placeholder text; signup requires ticking a consent box; acceptance timestamp is stored on the profile.
- **Hakkımızda content:** static template text in the i18n file for now (real text will replace it in code). No admin editing UI.
- **Üyelere Özel:** new `offers` table (sponsor name, title, description, optional link, optional valid-until date); admins create/edit/delete from the admin area; approved members read; shown as a section on Anasayfa. Text only, no images.
- **Etkinlik photos:** multiple photos (max 10, existing 5 MB/image limit and `covers` bucket); first photo is the cover used on cards; horizontal paging carousel on the detail page. Admins can add, remove and reorder is not needed.
- **Share:** native share sheet with title, date/time, place and a link to the etkinlik. (The user wrote "share profile"; interpreted as sharing the **etkinlik**.)
- **QR security:** the QR does not contain the member id alone. The app asks the server for a short-lived single-use token (valid about 90 seconds, auto-refreshing while the screen is open); the scanner sends the token plus the chosen etkinlik to a server function that checks the scanner's permission, the member's approved status, consumes the token and records attendance (one record per member per etkinlik; a repeat scan says "already checked in"). Scan screen lets the scanner pick the etkinlik (default: the nearest one by date). Needs the camera permission and `expo-camera`, which requires a development build, not Expo Go.
- **Date/time picker:** use the SDK-appropriate native picker (check the Expo SDK 58 docs, per `AGENTS.md`); must also work on the web build used for screenshots.
- **Keyboard/scroll:** fix once in the shared `Screen` component (scrollable content plus keyboard avoidance) so every form benefits, then verify on duyuru, etkinlik and talep forms.
- **Double post:** disable the submit button and guard against re-entry while saving; verify the cause (it may be a retry or a double handler, not just a missing disabled state).
- **Welcome:** `profiles.full_name` is a single field; show it whole.

### More builder's calls (from the reviewer's questions)

- **Price range:** `min_price` and `max_price` are both optional, nullable columns; open-ended ranges are allowed. In similar-talep matching a null bound means unbounded, and two ranges match when they overlap. The `listings` test rows are wiped in the migration.
- **"Tümünü seç" for rooms** selects every room option in the multi-select (it does not mean "no constraint"); matching logic is unchanged. A second tap clears them.
- **Scanner** is a normal approved member who has been given the scanner permission by an admin; they keep every member feature (Talepler, their own QR) and additionally get a "QR Tara" entry. Admins can also scan and have their own QR.
- **Attendance:** admins see the per-etkinlik attendance list (name, time) and can remove a mistaken check-in. Scanners do not see the list; they only get "checked in" / "already checked in" feedback. No manual add, no export.
- **Old routes:** `ilanlar` routes are removed outright (no redirects; no real users or stored links).
- **Recipient emails** are read from `auth.users` inside the Edge Function with the service role; no email column is added to `profiles`.
- **Dev build:** QR scanning needs an EAS development or preview build; testers on Expo Go cannot scan. Add the camera permission text to `app.json` and note the rebuild in the hand-off.
- **Supabase Auth dashboard settings** (redirect URL allowlist for password reset) are changed by the user in the dashboard; the builder gives the exact values.
- **Role and title editing** lives on the existing admin members screen; members see their own title in Profil.

### Answers from the user, round 2

- **Email consent:** approved. The signup consent checkbox also covers receiving ANEDER etkinlik and duyuru emails; each email carries a short "ANEDER member notice" footer. No per-person opt-out in this round.
- **Links:** the association site exists (https://www.aneder.org/) but its code is not available yet. For now the etkinlik share message and the emails carry the full details as text plus a link to the site's home page (builder's call, a placeholder). When the site gets etkinlik pages, swap in per-etkinlik links.
- **Builds:** the user already ships `.aab` builds through EAS, so the dev/preview build requirement for the camera is fine. Add the camera permission text to `app.json`.
- **Talepler replaces İlanlar** fully (confirmed).

### Push notifications (found while scoping, not yet fixed)

The user could not receive notifications in testing. Reading the code: the registration and send code look correct, but `app.json` has no `googleServicesFile` and the release guide's Firebase/FCM step (step 5 in `docs/RELEASING.md`) may not have been done. On Android, an app without FCM credentials cannot get a push token, and `registerForPush` in `src/lib/push.ts` returns silently when anything is missing, so a setup gap would look like "nothing happens". This has not been confirmed on a device. Since the new duyuru/etkinlik toggles depend on push, the builder first diagnoses it (is a token row saved in `push_tokens` for the test phone? does `send-push` report `sent: 0`?), then fixes the code side and tells the user exactly which Firebase/EAS credential step remains. Make `registerForPush` report failures (to Sentry-style logging or a visible message in admin) instead of failing silently.

## Constraints

- Follow `AGENTS.md`: check Expo SDK 58 docs before touching Expo APIs; use `npx expo install`; run lint and typecheck before declaring done.
- Turkish only; all new text goes through `src/i18n/tr.ts`.
- Supabase RLS is the enforcement layer: roles, scanner permission, offers and attendance must be protected there, not only in the UI. Extend `supabase/tests/rls.sql`.
- Existing pure-logic tests (`listingFilters`, etc.) must be updated for the new price range, and new logic gets tests.
- Verification as before: web build in a phone-sized window with screenshots under `screenshots/`; push, camera/QR scanning and email delivery are checked by hand on a phone.

## Suggested build order (builder may adjust)

1. Foundations: `Screen` keyboard/scroll fix, welcome name, Talep rename and reshape (price range, link, rooms select-all, text only, edit from Profil, similar matching).
2. Etkinlik and duyuru: double-post fix, date/time picker, multiple photos carousel, share.
3. Profil redesign, roles/titles, admin member management, Hakkımızda.
4. Auth: forgot password, legal consent pages.
5. Communication: send-email function, notification/email toggles, Üyelere Özel.
6. QR check-in: token functions, profile QR, scanner screen, attendance list.

## Left to the builder

Visual design of new screens within the existing look; exact picker and QR libraries; wording of Turkish labels; migration file layout.
