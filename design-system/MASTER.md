# ANEDER app — design system

Direction: **Minimalism / Swiss** (generated with the ui-ux-pro-max skill), kept on the ANEDER brand palette.
A soft grey page with white cards lifted by one light shadow; brand red is the only accent.
Tokens live in `src/theme.ts`; shared components in `src/components/ui.tsx`.

## Color (semantic tokens, never raw hex in screens)
| Token | Value | Use |
|---|---|---|
| primary / primaryPressed | #C8102E / #A30D25 | main actions, active tab, prices |
| primaryTint | #FCEBEE | badges, icon chips, avatar fallback |
| background / surface / surfaceMuted | #F5F6F8 / #FFFFFF / #ECEEF2 | page / cards + inputs / secondary buttons |
| ink / inkSoft / muted | #111214 / #3F444C / #5F6570 | text (all ≥ 4.5:1 on their backgrounds) |
| success / info (+Tint) | #146C3B / #1A5CA8 | Satılık / Kiralık badges, "Onaylı üye" |

## Scale
- Spacing 4 / 8 / 16 / 24 / 32 / 48. Radius 8 / 12 / 16 / 20 / pill. One shadow: `shadow.card`.
- Type: display 28, title 22, heading 17, body 16, caption/label 13. System font (Dynamic Type friendly).
- Touch targets ≥ 44pt (buttons 52, inputs 48, chips 44, list rows 56).

## Components
Button (primary / secondary / danger, icon, loading) · Field (focus ring, password show/hide) · Chip · Checkbox ·
Card · Badge · ListGroup + ListRow (settings-style rows) · InfoRow · SectionHeader · EmptyState · Skeleton · ErrorText · Avatar · Logo (white tile).

## Rules
- Icons: Ionicons only; outline when idle, filled when selected; never emoji.
- One primary action per screen; secondary actions use the muted fill; destructive uses red outline.
- Status is never color alone: badges always carry text.
- Loading → Skeleton (static under reduced motion); empty → EmptyState with a hint; submit → button spinner.
- Press feedback on everything tappable (opacity / slight scale), no layout shift.
