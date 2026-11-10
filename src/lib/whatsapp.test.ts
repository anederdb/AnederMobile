import { whatsappUrl } from './whatsapp';

describe('whatsappUrl', () => {
  it('turns a Turkish national number into an international wa.me link', () => {
    expect(whatsappUrl('0555 111 22 33')).toBe('https://wa.me/905551112233');
    expect(whatsappUrl('(0555) 111-22-33')).toBe('https://wa.me/905551112233');
  });

  it('accepts numbers without the leading zero', () => {
    expect(whatsappUrl('555 111 22 33')).toBe('https://wa.me/905551112233');
  });

  it('keeps numbers that already have a country code', () => {
    expect(whatsappUrl('+90 555 111 22 33')).toBe('https://wa.me/905551112233');
    expect(whatsappUrl('0090 555 111 22 33')).toBe('https://wa.me/905551112233');
    expect(whatsappUrl('+49 151 2345 6789')).toBe('https://wa.me/4915123456789');
  });

  it('returns null for numbers that cannot be dialed', () => {
    expect(whatsappUrl('')).toBeNull();
    expect(whatsappUrl('123')).toBeNull();
    expect(whatsappUrl('abc')).toBeNull();
  });
});
