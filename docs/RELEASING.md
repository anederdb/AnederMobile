# Releasing ANEDER Mobile (Android + iOS)

One rule keeps testing and production the same thing: **build with the `production` profile from the start, test those exact binaries through TestFlight (iOS) and Play internal testing (Android), then release the same builds.** No rebuild between "tested" and "live". The `preview` profile (installable APK) is only a shortcut for quick Android checks.

Bundle id / package: `org.aneder.app` (set in `app.json`). **Decide this before the first store submission; it cannot be changed afterwards.**

## One-time setup

1. **Expo account**: create one for ANEDER (free). On this machine the EAS CLI was logged in as another account, so run `npx eas-cli logout` then `npx eas-cli login`.
2. `npx eas-cli init` — creates the EAS project and writes `extra.eas.projectId` into `app.json` (push notifications need it). Commit the change.
3. **Environment variables** (the `.env` file is git-ignored, so cloud builds need their own copy). On expo.dev → project → Environment variables, add for both `preview` and `production`:
   - `EXPO_PUBLIC_SUPABASE_URL` = `https://unlsvmrethwpslhsubdy.supabase.co`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = the publishable key (safe to ship in an app)
   - Never add the service-role key; it only lives inside the Edge Functions.
4. **Accounts for the stores**
   - Apple Developer Program, 99 USD/year. Enrolling as an *organization* (needs a D-U-N-S number) can take days to weeks, so start early. Enrolling as an individual is faster but shows a personal name on the store page.
   - Google Play Console, 25 USD once. A new *personal* account must run a closed test with at least 12 testers for 14 days before it can publish to production; organization accounts are exempt.
5. **Push notifications**
   - Android: create a Firebase project, add an Android app with package `org.aneder.app`, download `google-services.json` into the repo root, add `"googleServicesFile": "./google-services.json"` under `android` in `app.json`, then upload the FCM V1 service-account key with `npx eas-cli credentials`.
   - iOS: nothing to do by hand; `eas build` creates the push key with your Apple account.
6. **Icons and splash**: `assets/images/icon.png`, `splash-icon.png` and the Android adaptive-icon images are still Expo placeholders. Replace them with the ANEDER logo (1024x1024 PNG, no transparency for the iOS icon). The logo file we have (188x188) is too small; ask the association for a vector or high-resolution file.

## Test builds

**Android (fastest):**
```bash
npx eas-cli build -p android --profile preview
```
EAS prints a link and QR code to an installable APK. Send it to testers.

**iOS and the real release candidate (both platforms):**
```bash
npx eas-cli build -p ios --profile production
npx eas-cli submit -p ios            # uploads to App Store Connect -> TestFlight
npx eas-cli build -p android --profile production   # produces an AAB for Google Play
npx eas-cli submit -p android        # uploads to Play (see note below)
```
- iOS testers: add them in App Store Connect → TestFlight. Internal testers (up to 100, members of your team) need no review; external testers need a short beta review.
- Android testers: add them to the Play Console **internal testing** track.
- Google requires the very first AAB of a new app to be uploaded by hand in Play Console (create the app, then upload once); after that `eas submit` works.
- Quick iOS test without TestFlight is possible with the `preview` profile, but it needs each tester's device registered (`npx eas-cli device:create`) and the paid Apple account.

## Going to production (after tests pass)

- **iOS**: in App Store Connect, pick the TestFlight build you tested for the app version, fill in the store listing, submit for review.
- **Android**: in Play Console, promote the same internal-testing release to Production.
- Build numbers are incremented automatically (`autoIncrement`); change `version` in `app.json` when you want a new visible version.

## Store requirements to prepare

- Privacy policy URL (Turkish; mention KVKK) and a support contact (e.g. info@aneder.org).
- App Review needs **demo login credentials** because the app is members-only: create an approved test member and give it in the review notes, and say that membership is approved by the association.
- Account deletion inside the app is required by both stores; it already exists (Profil → Hesabı Sil).
- Apple privacy labels and Google Data safety form: the app collects name, phone, email, firm and talep data, event photos (admins only), camera use for QR scanning (no images stored), and a push token.
- Store screenshots and a Turkish description.

## Before real members join

- Run `supabase/scripts/cleanup-test-data.sql` (dashboard SQL editor) and delete the leftover test files in Storage.
- Supabase **free projects pause after about a week of inactivity**, which would take the app offline. Move the project to the Pro plan before launch (it also adds daily backups and leaked-password protection).
- Supabase's built-in email sender is heavily rate limited; if email confirmation stays on, set up custom SMTP, or turn "Confirm email" off since admins approve members anyway.
- Do one real-phone test of event photo upload, a push notification, QR scanning and the password-reset link (none can be fully checked on web).

## Optional: fixing bugs without a store review

`npx expo install expo-updates` then `npx eas-cli update:configure` enables over-the-air updates for JavaScript-only fixes, with `preview` and `production` channels. Native changes (new libraries, permissions) still need a new build.
