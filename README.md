# ANEDER Mobile

Members-only mobile app for ANEDER (Ankara Emlakçılar Derneği): events and push notifications, member profiles with firms, a members-only listing pool, and in-app admin. Turkish only.

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
- Screenshots of each build step: `screenshots/`

## Push notifications

Admins send from Profil > Yönetim > Bildirim Gönder, or by switching on "Yayınlarken üyelere bildirim gönder" when creating an event. Delivery goes through the `send-push` Edge Function and the Expo push service.

Registration only runs on a real phone and needs a few one-time setup steps (it silently skips until they are done):

1. `npx eas-cli login` with the ANEDER Expo account, then `npx eas-cli init` (adds `extra.eas.projectId` to `app.json`).
2. Android: create a Firebase project, add the Android app, put `google-services.json` in the repo root, reference it as `android.googleServicesFile` in `app.json`, and upload the FCM credentials with `npx eas-cli credentials`.
3. iOS: an Apple Developer account; `eas build` sets up the push key.
4. Build a development or preview build (push does not work in Expo Go on Android) and check delivery by hand on a phone.
