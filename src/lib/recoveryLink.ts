/** Tokens from a Supabase password-recovery link, or null when the URL is not one. */
export function parseRecoveryUrl(url: string): { accessToken: string; refreshToken: string } | null {
  const hashAt = url.indexOf('#');
  const queryAt = url.indexOf('?');
  const parts = [
    hashAt >= 0 ? url.slice(hashAt + 1) : '',
    queryAt >= 0 ? url.slice(queryAt + 1, hashAt > queryAt ? hashAt : undefined) : '',
  ];
  for (const part of parts) {
    const params = new URLSearchParams(part);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (params.get('type') === 'recovery' && accessToken && refreshToken) return { accessToken, refreshToken };
  }
  return null;
}
