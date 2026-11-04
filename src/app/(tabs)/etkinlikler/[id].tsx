import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { t } from '@/i18n/tr';
import { formatTrDateTime } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import type { AppEvent } from '@/lib/types';
import { colors, radius, type } from '@/theme';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<AppEvent | null>(null);

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => setEvent(data as AppEvent | null));
  }, [id]);

  if (!event) {
    return (
      <Screen>
        <Text style={type.caption}>{t.common.loading}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      {event.cover_url ? (
        <Image
          source={{ uri: event.cover_url }}
          accessibilityLabel={event.title}
          contentFit="cover"
          style={{ aspectRatio: 16 / 9, borderRadius: radius.lg, backgroundColor: colors.border }}
        />
      ) : null}
      <Text style={type.display}>{event.title}</Text>
      <Text style={[type.heading, { color: colors.primary }]}>{formatTrDateTime(event.starts_at)}</Text>
      {event.location ? (
        <Text style={type.body}>
          {t.events.location}: {event.location}
        </Text>
      ) : null}
      {event.description ? <Text style={type.body}>{event.description}</Text> : null}
    </Screen>
  );
}
