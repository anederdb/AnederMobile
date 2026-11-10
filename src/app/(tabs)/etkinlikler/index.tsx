import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text } from 'react-native';

import { EventCard, SectionTitle } from '@/components/EventCard';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/ui';
import { t } from '@/i18n/tr';
import { supabase } from '@/lib/supabase';
import type { AppEvent } from '@/lib/types';
import { type } from '@/theme';

export default function Events() {
  const [events, setEvents] = useState<AppEvent[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      supabase
        .from('events')
        .select('*')
        .order('starts_at')
        .then(({ data }) => setEvents((data as AppEvent[]) ?? []));
    }, []),
  );

  const now = Date.now();
  const upcoming = (events ?? []).filter((e) => new Date(e.starts_at).getTime() >= now);
  const past = (events ?? []).filter((e) => new Date(e.starts_at).getTime() < now).reverse();

  return (
    <Screen>
      <Text style={type.display}>{t.events.title}</Text>
      {events === null ? (
        <>
          <Skeleton height={96} />
          <Skeleton height={96} />
        </>
      ) : null}
      {events && events.length === 0 ? <EmptyState icon="calendar-outline" title={t.events.empty} /> : null}
      {upcoming.length > 0 ? <SectionTitle>{t.events.upcoming}</SectionTitle> : null}
      {upcoming.map((e) => (
        <EventCard key={e.id} event={e} />
      ))}
      {past.length > 0 ? <SectionTitle>{t.events.past}</SectionTitle> : null}
      {past.map((e) => (
        <EventCard key={e.id} event={e} dimmed />
      ))}
    </Screen>
  );
}
