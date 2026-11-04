import { applyListingFilters, formatPrice, normalizeFilters, normalizeTr } from './listingFilters';

describe('normalizeTr', () => {
  it.each([
    ['İncek', 'incek'],
    ['INCEK', 'incek'],
    ['Çayyolu', 'cayyolu'],
    ['  Şehit Cengiz Karaca ', 'sehit cengiz karaca'],
    ['Ümitköy', 'umitkoy'],
  ])('maps %p to %p', (input, expected) => {
    expect(normalizeTr(input)).toBe(expected);
  });
});

describe('normalizeFilters', () => {
  it('swaps min and max when min is larger', () => {
    expect(normalizeFilters({ minPrice: 12_000_000, maxPrice: 8_000_000 })).toEqual({ minPrice: 8_000_000, maxPrice: 12_000_000 });
  });

  it('drops empty and blank values', () => {
    expect(normalizeFilters({ district: '', neighborhood: '  ', rooms: undefined })).toEqual({});
  });
});

// A query-builder stub that records the calls it receives.
function recorder() {
  const calls: [string, ...unknown[]][] = [];
  const q: Record<string, unknown> = {};
  for (const m of ['eq', 'gte', 'lte']) {
    q[m] = (...args: unknown[]) => {
      calls.push([m, ...args]);
      return q;
    };
  }
  return { q, calls };
}

describe('applyListingFilters', () => {
  it('adds no constraints for empty filters', () => {
    const { q, calls } = recorder();
    applyListingFilters(q as never, {});
    expect(calls).toEqual([]);
  });

  it('maps filters to column constraints', () => {
    const { q, calls } = recorder();
    applyListingFilters(q as never, {
      type: 'satilik',
      district: 'Gölbaşı',
      neighborhood: 'İncek',
      rooms: '4+1',
      minPrice: 8_000_000,
      maxPrice: 12_000_000,
    });
    expect(calls).toEqual([
      ['eq', 'type', 'satilik'],
      ['eq', 'district', 'Gölbaşı'],
      ['eq', 'neighborhood_norm', 'incek'],
      ['eq', 'rooms', '4+1'],
      ['gte', 'price', 8_000_000],
      ['lte', 'price', 12_000_000],
    ]);
  });
});

describe('formatPrice', () => {
  it.each([
    [10_000_000, '10.000.000 ₺'],
    [950_000, '950.000 ₺'],
    [0, '0 ₺'],
  ])('formats %p as %p', (n, expected) => {
    expect(formatPrice(n)).toBe(expected);
  });
});
