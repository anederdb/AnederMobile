import { applyListingFilters, formatPrice, normalizeFilters, normalizeTr, parsePriceInput, formatPriceRange } from './listingFilters';

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
    expect(normalizeFilters({ district: '', neighborhood: '  ', rooms: [] })).toEqual({});
  });

  it('keeps the side (al / ver)', () => {
    expect(normalizeFilters({ side: 'ver' })).toEqual({ side: 'ver' });
    expect(normalizeFilters({ side: 'al', type: 'kiralik' })).toEqual({ type: 'kiralik', side: 'al' });
  });
});

// A query-builder stub that records the calls it receives.
function recorder() {
  const calls: [string, ...unknown[]][] = [];
  const q: Record<string, unknown> = {};
  for (const m of ['eq', 'overlaps', 'or']) {
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
      rooms: ['3+1', '4+1'],
      minPrice: 8_000_000,
      maxPrice: 12_000_000,
    });
    expect(calls).toEqual([
      ['eq', 'type', 'satilik'],
      ['eq', 'district', 'Gölbaşı'],
      ['eq', 'neighborhood_norm', 'incek'],
      ['overlaps', 'rooms', ['3+1', '4+1']],
      ['or', 'max_price.is.null,max_price.gte.8000000'],
      ['or', 'min_price.is.null,min_price.lte.12000000'],
    ]);
  });

  it('filters by side', () => {
    const { q, calls } = recorder();
    applyListingFilters(q as never, { side: 'al' });
    expect(calls).toEqual([['eq', 'side', 'al']]);
  });

  it('adds no side constraint when the side is not set', () => {
    const { q, calls } = recorder();
    applyListingFilters(q as never, { type: 'kiralik' });
    expect(calls.some((c) => c[1] === 'side')).toBe(false);
  });

  it('adds only the bound that was given', () => {
    const { q, calls } = recorder();
    applyListingFilters(q as never, { minPrice: 5_000_000 });
    expect(calls).toEqual([['or', 'max_price.is.null,max_price.gte.5000000']]);
  });
});

describe('parsePriceInput', () => {
  it.each([
    ['5.000.000', 5_000_000],
    ['5000000', 5_000_000],
    ['1.250,5', 1250.5],
    ['', null],
    ['   ', null],
    ['abc', null],
  ])('parses %p as %p', (input, expected) => {
    expect(parsePriceInput(input)).toBe(expected);
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

describe('formatPriceRange', () => {
  it.each([
    [5_000_000, 8_000_000, '5.000.000 ₺ – 8.000.000 ₺'],
    [5_000_000, null, 'En az 5.000.000 ₺'],
    [null, 8_000_000, 'En çok 8.000.000 ₺'],
    [null, null, null],
  ])('formats %p..%p', (min, max, expected) => {
    expect(formatPriceRange(min, max)).toBe(expected);
  });
});
