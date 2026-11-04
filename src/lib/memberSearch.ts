import { normalizeTr } from './listingFilters';

/** True when the query is empty or appears in the member's name or any of their firm names (Turkish-insensitive). */
export function matchesMember(query: string, member: { full_name: string | null; firms: string[] }): boolean {
  const q = normalizeTr(query);
  if (!q) return true;
  return [member.full_name ?? '', ...member.firms].some((text) => normalizeTr(text).includes(q));
}
