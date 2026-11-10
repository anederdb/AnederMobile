// Design tokens. Palette is taken from the ANEDER logo: brand red, ink black, greys, white.
// Layout idea: a soft grey page (`background`) with white cards (`surface`) lifted by a light shadow.
export const colors = {
  primary: '#C8102E', // brand red (5.9:1 on white)
  primaryPressed: '#A30D25',
  primaryTint: '#FCEBEE', // pale red for badges and icon chips (red text on it is 5.3:1)
  onPrimary: '#FFFFFF',
  ink: '#111214', // headings and body
  inkSoft: '#3F444C', // secondary text
  muted: '#5F6570', // captions, inactive tabs (5.6:1 on the page background)
  placeholder: '#8A8F98',
  border: '#E2E5EA',
  background: '#F5F6F8', // page
  surface: '#FFFFFF', // cards and inputs
  surfaceMuted: '#ECEEF2', // secondary buttons, avatar fallback, skeletons
  danger: '#C8102E', // used as outline/text only so it never reads as a primary action
  success: '#146C3B',
  successTint: '#E4F4EA',
  info: '#1A5CA8',
  infoTint: '#E6EFFA',
} as const;

// 4/8 rhythm
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const;

// One elevation scale, used for every card.
export const shadow = {
  card: { boxShadow: '0 1px 2px rgba(17, 18, 20, 0.05), 0 6px 16px rgba(17, 18, 20, 0.06)' },
} as const;

export const type = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const, letterSpacing: -0.3, color: colors.ink },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const, color: colors.ink },
  heading: { fontSize: 17, lineHeight: 24, fontWeight: '600' as const, color: colors.ink },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const, color: colors.ink },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const, color: colors.muted },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const, color: colors.inkSoft },
};

export const touch = { minHeight: 48 } as const;

// Box style shared by every card-like View that is not the <Card> component.
export const card = { backgroundColor: colors.surface, borderRadius: radius.xl, padding: space.md, ...shadow.card } as const;
