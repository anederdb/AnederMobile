import { parseRecoveryUrl } from './recoveryLink';

describe('parseRecoveryUrl', () => {
  it('reads tokens from a recovery link fragment', () => {
    expect(parseRecoveryUrl('anader://reset#access_token=AAA&refresh_token=BBB&expires_in=3600&type=recovery')).toEqual({
      accessToken: 'AAA',
      refreshToken: 'BBB',
    });
  });

  it('also accepts tokens in the query string', () => {
    expect(parseRecoveryUrl('exp://192.168.1.2:8081/--/reset?access_token=AAA&refresh_token=BBB&type=recovery')).toEqual({
      accessToken: 'AAA',
      refreshToken: 'BBB',
    });
  });

  it.each([
    'anader://reset',
    'anader://reset#access_token=AAA&refresh_token=BBB&type=signup',
    'anader://reset#access_token=AAA&type=recovery',
    'anader://reset#refresh_token=BBB&type=recovery',
    'not a url',
    '',
  ])('returns null for %p', (url) => {
    expect(parseRecoveryUrl(url)).toBeNull();
  });
});
