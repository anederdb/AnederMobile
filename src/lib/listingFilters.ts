export type ListingFilters = {
  type?: 'satilik' | 'kiralik';
  district?: string;
  neighborhood?: string;
  rooms?: string[];
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
  const rooms = (f.rooms ?? []).map((r) => r.trim()).filter(Boolean);
  if (rooms.length) out.rooms = rooms;
  let { minPrice, maxPrice } = f;
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];
  if (minPrice !== undefined) out.minPrice = minPrice;
  if (maxPrice !== undefined) out.maxPrice = maxPrice;
  return out;
}

type Chainable = {
  eq(column: string, value: unknown): Chainable;
  overlaps(column: string, value: unknown[]): Chainable;
  or(filters: string): Chainable;
};

/** Adds the filter constraints to a Supabase select query. */
export function applyListingFilters<Q>(query: Q, filters: ListingFilters): Q {
  const f = normalizeFilters(filters);
  let q = query as unknown as Chainable;
  if (f.type) q = q.eq('type', f.type);
  if (f.district) q = q.eq('district', f.district);
  if (f.neighborhood) q = q.eq('neighborhood_norm', normalizeTr(f.neighborhood));
  if (f.rooms) q = q.overlaps('rooms', f.rooms);
  // A talep matches when its price range overlaps the filter range; a missing bound is open-ended.
  if (f.minPrice !== undefined) q = q.or(`max_price.is.null,max_price.gte.${f.minPrice}`);
  if (f.maxPrice !== undefined) q = q.or(`min_price.is.null,min_price.lte.${f.maxPrice}`);
  return q as unknown as Q;
}

/** "5.000.000" / "5000000" / "1.250,5" -> number; blank or non-numeric -> null. */
export function parsePriceInput(input: string): number | null {
  if (!input.trim()) return null;
  const n = Number(input.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function formatPrice(n: number): string {
  return `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ₺`;
}

/** "5.000.000 ₺ – 8.000.000 ₺", "En az 5.000.000 ₺", "En çok 8.000.000 ₺", or null when neither bound is set. */
export function formatPriceRange(min: number | null, max: number | null): string | null {
  if (min != null && max != null) return `${formatPrice(min)} – ${formatPrice(max)}`;
  if (min != null) return `En az ${formatPrice(min)}`;
  if (max != null) return `En çok ${formatPrice(max)}`;
  return null;
}
