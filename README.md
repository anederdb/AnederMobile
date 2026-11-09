# ANEDER Mobile

Members-only mobile app for ANEDER (Ankara Emlakçılar Derneği): events and push notifications, member profiles with firms, a members-only pool of Talepler (text requests with a price range), and in-app admin. Turkish only.

Stack: Expo (SDK 58, expo-router, TypeScript) + Supabase (Auth, Postgres, Storage, Edge Functions).

## Run

```bash
npm install
# create .env with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
npx expo start --web     # or: npx expo start, then open on a phone
```

## Docs

- Design: `docs/superpowers/specs/2026-11-04-anader-mobile-design.md`
- Plan: `docs/superpowers/plans/2026-11-04-anader-mobile.md`
- Feedback round 1: `docs/superpowers/specs/2026-11-09-feedback-round-design.md` and `docs/superpowers/plans/2026-11-09-feedback-round.md`
- Screenshots of each build step: `screenshots/`

## Push notifications

Admins send from Profil > Yönetim > Bildirim Gönder, or by leaving "Bildirim gönder" on when creating an etkinlik or duyuru. Delivery goes through the `send-push` Edge Function and the Expo push service.

Registration only runs on a real phone and needs a few one-time setup steps (it silently skips until they are done):

1. `npx eas-cli login` with the ANEDER Expo account, then `npx eas-cli init` (adds `extra.eas.projectId` to `app.json`).
2. Android: create a Firebase project, add the Android app, put `google-services.json` in the repo root, reference it as `android.googleServicesFile` in `app.json`, and upload the FCM credentials with `npx eas-cli credentials`.
3. iOS: an Apple Developer account; `eas build` sets up the push key.
4. Build a development or preview build (push does not work in Expo Go on Android) and check delivery by hand on a phone.

## Setting up feedback round 1 (one time)

1. **Database:** run `supabase/migrations/0009` to `0014` in order in the Supabase SQL editor (0009 wipes the old listings). Then run each test block in `supabase/tests/rls.sql` that ends with `... PASSED` (success shows up as that exception message). In Dashboard > Storage delete the unused `listing-photos` bucket.
2. **Email:** create a Resend account, verify `aneder.org` (until then only Resend's sandbox sender works), then `supabase secrets set RESEND_API_KEY=... MAIL_FROM="ANEDER <info@aneder.org>"` and deploy `send-email`. Only members who ticked the email-consent box at signup receive mail.
3. **Edge Functions:** redeploy `send-email` (new) and `delete-account` (changed).
4. **Password reset:** Supabase Auth > URL Configuration > Redirect URLs: add `anader://reset` (and the dev/web equivalents you test with, e.g. `http://localhost:8081/reset`).
5. **Native build:** `expo-camera` and `react-native-svg` are new, so make a fresh EAS build; QR scanning does not work in Expo Go.
6. **Commit `app.json`:** the EAS `projectId`/`owner` edits are still uncommitted; push needs `projectId`.
7. **Placeholders to replace with real text:** Başkan Mesajı and Hakkımızda (`src/i18n/tr.ts`, `about`), Kullanım Şartları and Aydınlatma Metni (`legal`).

## Releasing

See `docs/RELEASING.md` for building test and production versions for Android and iOS with EAS.
