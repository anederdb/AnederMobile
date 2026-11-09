const PREFIX = 'anader:qr:';

export function buildQrPayload(token: string): string {
  return PREFIX + token;
}

/** The token inside a member QR, or null for anything that is not one of ours. */
export function parseQrPayload(raw: string): string | null {
  const m = /^anader:qr:([A-Za-z0-9]{16,128})$/.exec(raw);
  return m ? m[1] : null;
}
