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
