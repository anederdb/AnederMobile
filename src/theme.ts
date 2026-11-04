// Design tokens. Palette is taken from the ANEDER logo: brand red, ink black, greys, white.
export const colors = {
  primary: '#C8102E', // brand red (5.9:1 on white)
  primaryPressed: '#A30D25',
  onPrimary: '#FFFFFF',
  ink: '#111214', // headings and body
  inkSoft: '#4A4F57', // secondary text (8:1 on white)
  muted: '#6B7078', // captions, inactive tabs (5:1 on white)
  placeholder: '#8A8F98',
  border: '#E3E5E8',
  surface: '#F5F6F7', // cards, secondary buttons
  background: '#FFFFFF',
  danger: '#C8102E', // used as outline/text only so it never reads as a primary action
} as const;

// 4/8 rhythm
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const type = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const, letterSpacing: -0.3, color: colors.ink },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const, color: colors.ink },
  heading: { fontSize: 17, lineHeight: 24, fontWeight: '600' as const, color: colors.ink },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const, color: colors.ink },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const, color: colors.muted },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const, color: colors.inkSoft },
};

export const touch = { minHeight: 48 } as const;
