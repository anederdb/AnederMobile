import { buildQrPayload, parseQrPayload } from './qr';

const token = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

describe('QR payload', () => {
  it('round-trips a token', () => {
    expect(buildQrPayload(token)).toBe(`anader:qr:${token}`);
    expect(parseQrPayload(buildQrPayload(token))).toBe(token);
  });

  it.each([
    '',
    'https://aneder.org',
    'anader:qr:',
    'anader:qr:short',
    `anader:qr:${token}:extra`,
    `ANADER:qr:${token}`,
    `anader:qr:${token}\nanother`,
    `xanader:qr:${token}`,
  ])('rejects %p', (raw) => {
    expect(parseQrPayload(raw)).toBeNull();
  });
});
