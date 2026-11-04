# ANEDER Mobile App — Design

Date: 2026-11-04
Client: ANEDER (Ankara Emlakçılar Derneği), via its president. Builder: Gökberk.

## Intent

A members-only mobile app for ANEDER's real estate agents. The association's main need is to publish events and announcements and push notifications to members. Secondary: give members a directory, a profile with their firms, and a shared pool of property listings. The association's current website UI is considered poor; the app gets a new look built from the foundation's logo and photos. A website rebuild is a separate, later project.

## Users

- **Members:** ANEDER agents (all real estate agents in Ankara).
- **Admins:** the president and a few staff. They create events/announcements, send push notifications and approve new members.
- No public/anonymous users.

## Goals

1. Members read events and announcements and get push notifications.
2. Members sign up, are approved by an admin, and manage their profile (create, update, delete account).
3. A profile lists the firms the member works at or owns, each with an optional Sahibinden.com link.
4. Members post and browse listings from their portfolio, visible to members only.
5. Listings are searchable with filters, and show "similar listings".
6. Admin screens live inside the app (events, announcements, push, member approval).
7. Turkish only; text kept easy to translate later.

## Non-goals (v1)

- AI/ML recommendations. A rule-based "similar listings" ranking is enough to start.
- Public (non-member) access.
- The website and a web admin panel (next project; will reuse the same Supabase backend).
- Scraping Sahibinden. Links are plain links only.
- Playwright tests. Deferred by the user for now.

## Verification

After each build step, run the Expo web build in a phone-sized browser window and save screenshots to `screenshots/<step>/`. Push notification delivery is not testable on web and is checked by hand on a phone.

## Accounts

GitHub repo: https://github.com/anederdb/AnederMobile (account `anederdb`, anederdb@gmail.com). Supabase project: "anader-mobile" (`unlsvmrethwpslhsubdy`, region eu-central-1 Frankfurt), created 2026-11-04. The original empty Sydney project "anederdb's Project" (`hdysxwedhpcwlldddzjc`) is to be deleted by the user. Use only these accounts, not any other credentials on the machine.
- Payments, chat, member dues.

## Anti-goals

- Non-members seeing member data or listings.
- Staff needing a developer to publish an event.
- A reskin of the reference app that does not feel like ANEDER.

## Navigation (decided: option B)

Bottom tabs: **Anasayfa · Etkinlikler · İlanlar · Üyeler · Profil**

- Anasayfa: upcoming event card, announcements, new listings, "listings for you".
- Etkinlikler: event list and detail.
- İlanlar: listings with filters, detail with similar listings, "post a listing".
- Üyeler: member directory (approved members only).
- Profil: own profile, firms (+ Sahibinden links), own listings, settings, delete account, and an Admin section visible only to admins.

The reference screenshots (a similar association app) are the structural basis: quick-access tiles, featured carousel, category chips, card lists, a floating add button.

## Decisions made by the user

- React Native (Android + iOS), Supabase backend.
- Members only; pending until admin approval after open sign-up.
- Admin role: president and a few staff; admin UI inside the mobile app first.
- Listings visible to members only.
- Recommender: starts as filters plus similar-listings, no AI.
- Turkish only.
- Navigation option B.
- UI/UX Pro Max skill is used for visual design; foundation logo/photos are used; do not copy the website's look.

## Builder's calls (not yet confirmed by the user)

- Expo + expo-router + TypeScript, Supabase (Auth, Postgres, Storage, Row Level Security, Edge Functions), Expo push notifications. Follows the user's existing stack conventions.
- Events live in Supabase; the future website reads the same data. Reading the existing WordPress site's events is not planned.
- Roles stored in a `profiles.role` (`member` | `admin`) and `profiles.status` (`pending` | `approved`), enforced with RLS, not just in the UI.
- "Similar listings" = score by district match, price within a band (about ±20%), and room count/size closeness.
- Account deletion removes the profile, firms and listings.
- Login by email + password first.

## Open items for the builder to settle

- Exact listing fields (type, district, price, rooms, m², photos, description) — start with these.
- Brand colors/typography, taken from the ANEDER logo, applied through the design skill.
- Push token registration and the send flow design.

## Build order (each step verified before the next)

1. Project scaffold, Supabase project, auth, pending/approved gating.
2. Profile + firms (+ Sahibinden links), delete account.
3. Events, announcements, admin create screens.
4. Push notifications.
5. Listings, filters, similar listings.
6. Member directory.
7. UI polish with brand assets.
