import { matchesMember } from './memberSearch';

const member = { full_name: 'Çağrı Şahin', firms: ['İncek Gayrimenkul', 'Yaşam Emlak'] };

describe('matchesMember', () => {
  it('matches everything for an empty query', () => {
    expect(matchesMember('', member)).toBe(true);
    expect(matchesMember('   ', member)).toBe(true);
  });

  it.each(['cagri', 'ÇAĞRI', 'sahin', 'ağrı şah'])('matches the name with %p', (q) => {
    expect(matchesMember(q, member)).toBe(true);
  });

  it.each(['incek', 'İNCEK', 'yasam'])('matches a firm name with %p', (q) => {
    expect(matchesMember(q, member)).toBe(true);
  });

  it('does not match unrelated text', () => {
    expect(matchesMember('kadıköy', member)).toBe(false);
  });

  it('handles a member without a name or firms', () => {
    expect(matchesMember('a', { full_name: null, firms: [] })).toBe(false);
    expect(matchesMember('', { full_name: null, firms: [] })).toBe(true);
  });
});
