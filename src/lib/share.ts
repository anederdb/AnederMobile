import { Share } from 'react-native';

import { formatTrDateTime } from './dates';

export const SITE_URL = 'https://www.aneder.org/';

type Shareable = { title: string; starts_at: string; location: string | null; description: string | null };

export function buildEventShareText(e: Shareable): string {
  return [e.title, formatTrDateTime(e.starts_at), e.location, e.description, SITE_URL].filter(Boolean).join('\n');
}

export async function shareEvent(e: Shareable): Promise<void> {
  await Share.share({ message: buildEventShareText(e) });
}
