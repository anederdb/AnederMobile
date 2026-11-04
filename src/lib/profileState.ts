import type { Profile } from './types';

/** A failed fetch must not look like "no profile" (that would send an approved member to the pending screen). */
export function nextProfile(
  previous: Profile | null,
  result: { data: Profile | null; error: unknown },
): Profile | null {
  if (result.error) return previous;
  if (!result.data) return null;
  // Same content -> same object, so effects and forms keyed on `profile` are not reset.
  return previous && JSON.stringify(previous) === JSON.stringify(result.data) ? previous : result.data;
}

/** The hourly token refresh does not change the profile, so skip the refetch. */
export function shouldReloadProfile(event: string): boolean {
  return event !== 'TOKEN_REFRESHED';
}
