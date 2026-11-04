// Must stay in sync with the check constraint on public.firms.sahibinden_url.
const SAHIBINDEN = /^https:\/\/([a-z0-9-]+\.)?sahibinden\.com(\/|$)/i;

export function normalizeSahibindenUrl(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
  return SAHIBINDEN.test(candidate) ? candidate : null;
}
