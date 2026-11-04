export type ListingFilters = {
  type?: 'satilik' | 'kiralik';
  district?: string;
  neighborhood?: string;
  rooms?: string;
  minPrice?: number;
  maxPrice?: number;
};

const FROM = 'İIıŞşĞğÜüÖöÇç';
const TO = 'iiissgguuoocc';

/** Lowercase, trimmed, Turkish letters folded to ASCII. Must match `neighborhood_norm` in the database. */
export function normalizeTr(input: string): string {
  return [...input.trim()]
    .map((ch) => {
      const i = FROM.indexOf(ch);
      return i === -1 ? ch : TO[i];
    })
    .join('')
    .toLowerCase();
}

export function normalizeFilters(f: ListingFilters): ListingFilters {
  const out: ListingFilters = {};
  if (f.type) out.type = f.type;
  if (f.district?.trim()) out.district = f.district.trim();
  if (f.neighborhood?.trim()) out.neighborhood = f.neighborhood.trim();
  if (f.rooms?.trim()) out.rooms = f.rooms.trim();
  let { minPrice, maxPrice } = f;
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];
  if (minPrice !== undefined) out.minPrice = minPrice;
  if (maxPrice !== undefined) out.maxPrice = maxPrice;
  return out;
}

type Chainable = {
  eq(column: string, value: unknown): Chainable;
  gte(column: string, value: unknown): Chainable;
  lte(column: string, value: unknown): Chainable;
};

/** Adds the filter constraints to a Supabase select query. */
export function applyListingFilters<Q>(query: Q, filters: ListingFilters): Q {
  const f = normalizeFilters(filters);
  let q = query as unknown as Chainable;
  if (f.type) q = q.eq('type', f.type);
  if (f.district) q = q.eq('district', f.district);
  if (f.neighborhood) q = q.eq('neighborhood_norm', normalizeTr(f.neighborhood));
  if (f.rooms) q = q.eq('rooms', f.rooms);
  if (f.minPrice !== undefined) q = q.gte('price', f.minPrice);
  if (f.maxPrice !== undefined) q = q.lte('price', f.maxPrice);
  return q as unknown as Q;
}

export function formatPrice(n: number): string {
  return `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ₺`;
}
