import { nextProfile, shouldReloadProfile } from './profileState';
import type { Profile } from './types';

const approved: Profile = {
  id: 'u1',
  full_name: 'Üye Test',
  phone: '0500',
  avatar_url: null,
  title: null,
  role: 'member',
  status: 'approved',
  created_at: '2026-11-04T00:00:00Z',
};

describe('nextProfile', () => {
  it('keeps the previous profile when the fetch failed', () => {
    expect(nextProfile(approved, { data: null, error: new Error('network') })).toBe(approved);
  });

  it('keeps the same object when nothing changed, so forms are not reset', () => {
    expect(nextProfile(approved, { data: { ...approved }, error: null })).toBe(approved);
  });

  it('takes the new profile when it changed', () => {
    const changed = { ...approved, full_name: 'Yeni Ad' };
    expect(nextProfile(approved, { data: changed, error: null })).toBe(changed);
  });

  it('clears the profile when the row is genuinely gone', () => {
    expect(nextProfile(approved, { data: null, error: null })).toBeNull();
  });

  it('starts from null', () => {
    expect(nextProfile(null, { data: approved, error: null })).toBe(approved);
  });
});

describe('shouldReloadProfile', () => {
  it.each(['SIGNED_IN', 'USER_UPDATED', 'INITIAL_SESSION'])('reloads on %s', (event) => {
    expect(shouldReloadProfile(event)).toBe(true);
  });

  it('does not reload on the hourly token refresh', () => {
    expect(shouldReloadProfile('TOKEN_REFRESHED')).toBe(false);
  });
});
