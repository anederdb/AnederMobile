import { parseLink } from './links';

describe('parseLink', () => {
  it('treats blank as no link', () => {
    expect(parseLink('')).toEqual({ ok: true, url: null });
    expect(parseLink('   ')).toEqual({ ok: true, url: null });
  });

  it('adds https:// when the scheme is missing', () => {
    expect(parseLink('aneder.org')).toEqual({ ok: true, url: 'https://aneder.org' });
  });

  it('keeps http and https links', () => {
    expect(parseLink('http://www.sahibinden.com/ilan/1')).toEqual({ ok: true, url: 'http://www.sahibinden.com/ilan/1' });
    expect(parseLink(' https://aneder.org/a?b=1 ')).toEqual({ ok: true, url: 'https://aneder.org/a?b=1' });
  });

  it.each(['javascript:alert(1)', 'ftp://aneder.org', 'http://x', 'not a link', 'data:text/html,hi'])('rejects %p', (input) => {
    expect(parseLink(input)).toEqual({ ok: false });
  });
});
