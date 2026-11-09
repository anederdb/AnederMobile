import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { PhotoCarousel } from '@/components/PhotoCarousel';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/ui';
import { t } from '@/i18n/tr';
import { formatTrDateTime } from '@/lib/dates';
import { shareEvent } from '@/lib/share';
import { supabase } from '@/lib/supabase';
import type { AppEvent, EventPhoto } from '@/lib/types';
import { colors, type } from '@/theme';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<AppEvent | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => setEvent(data as AppEvent | null));
    supabase
      .from('event_photos')
      .select('url')
      .eq('event_id', id)
      .order('position')
      .then(({ data }) => setPhotos(((data as Pick<EventPhoto, 'url'>[]) ?? []).map((p) => p.url)));
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
      <PhotoCarousel urls={photos.length ? photos : event.cover_url ? [event.cover_url] : []} label={event.title} />
      <Text style={type.display}>{event.title}</Text>
      <Text style={[type.heading, { color: colors.primary }]}>{formatTrDateTime(event.starts_at)}</Text>
      {event.location ? (
        <Text style={type.body}>
          {t.events.location}: {event.location}
        </Text>
      ) : null}
      {event.description ? <Text style={type.body}>{event.description}</Text> : null}
      <Button title={t.events.share} variant="secondary" onPress={() => shareEvent(event)} />
    </Screen>
  );
}
