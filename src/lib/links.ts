export type ParsedLink = { ok: true; url: string | null } | { ok: false };

/** Blank -> no link; adds https:// when no scheme; only http(s) URLs with a dotted host are accepted. */
export function parseLink(input: string): ParsedLink {
  const text = input.trim();
  if (!text) return { ok: true, url: null };
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(text) && !/^[^/]*\.[^/]*:\d+/.test(text) ? text : `https://${text}`;
  try {
    const u = new URL(withScheme);
    if ((u.protocol !== 'http:' && u.protocol !== 'https:') || !u.hostname.includes('.')) return { ok: false };
    return { ok: true, url: withScheme };
  } catch {
    return { ok: false };
  }
}
