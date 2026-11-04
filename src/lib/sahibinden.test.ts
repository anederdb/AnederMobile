import { normalizeSahibindenUrl } from './sahibinden';

describe('normalizeSahibindenUrl', () => {
  it('keeps a valid https sahibinden url', () => {
    expect(normalizeSahibindenUrl('https://www.sahibinden.com/magaza/x')).toBe('https://www.sahibinden.com/magaza/x');
  });

  it('adds https to a bare sahibinden url', () => {
    expect(normalizeSahibindenUrl('sahibinden.com/magaza/x')).toBe('https://sahibinden.com/magaza/x');
  });

  it('trims whitespace', () => {
    expect(normalizeSahibindenUrl('  https://sahibinden.com/magaza/x  ')).toBe('https://sahibinden.com/magaza/x');
  });

  it.each(['', '   ', 'javascript:alert(1)', 'https://evil.com/sahibinden.com', 'http://sahibinden.com/x', 'https://sahibinden.com.evil.com/x'])(
    'rejects %p',
    (input) => {
      expect(normalizeSahibindenUrl(input)).toBeNull();
    },
  );
});
