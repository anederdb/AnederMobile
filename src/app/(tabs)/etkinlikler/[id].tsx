import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { PhotoCarousel } from '@/components/PhotoCarousel';
import { Screen } from '@/components/Screen';
import { Button, Card, InfoRow, Skeleton } from '@/components/ui';
import { t } from '@/i18n/tr';
import { formatTrDateTime } from '@/lib/dates';
import { shareEvent } from '@/lib/share';
import { supabase } from '@/lib/supabase';
import type { AppEvent, EventPhoto } from '@/lib/types';
import { colors, space, type } from '@/theme';

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
        <Skeleton height={200} />
        <Skeleton height={36} />
        <Skeleton height={96} />
      </Screen>
    );
  }

  return (
    <Screen>
      <PhotoCarousel urls={photos.length ? photos : event.cover_url ? [event.cover_url] : []} label={event.title} />
      <Text style={type.display}>{event.title}</Text>
      <Card style={{ gap: space.md }}>
        <InfoRow icon="calendar-outline" text={formatTrDateTime(event.starts_at)} />
        {event.location ? <InfoRow icon="location-outline" text={event.location} /> : null}
      </Card>
      {event.description ? <Text style={type.body}>{event.description}</Text> : null}
      <Button title={t.events.share} variant="secondary" icon={<Ionicons name="share-social-outline" size={20} color={colors.ink} />} onPress={() => shareEvent(event)} />
    </Screen>
  );
}
