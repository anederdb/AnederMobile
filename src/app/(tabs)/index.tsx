import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { Empty, EventCard, SectionTitle } from '@/components/EventCard';
import { Logo } from '@/components/Logo';
import { Screen } from '@/components/Screen';
import { t } from '@/i18n/tr';
import { formatTrDateTime } from '@/lib/dates';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import type { Announcement, AppEvent } from '@/lib/types';
import { colors, radius, space, type } from '@/theme';

export default function Home() {
  const { profile } = useSession();
  const [next, setNext] = useState<AppEvent | null>(null);
  const [news, setNews] = useState<Announcement[]>([]);

  useFocusEffect(
    useCallback(() => {
      supabase
        .from('events')
        .select('*')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at')
        .limit(1)
        .then(({ data }) => setNext((data as AppEvent[] | null)?.[0] ?? null));
      supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3)
        .then(({ data }) => setNews((data as Announcement[]) ?? []));
    }, []),
  );

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Logo size={56} />
        <View style={{ flex: 1 }}>
          <Text style={type.caption}>{t.auth.tagline}</Text>
          <Text style={type.title}>Hoş geldin, {profile?.full_name?.split(' ')[0] ?? ''}</Text>
        </View>
      </View>
      <SectionTitle>{t.events.next}</SectionTitle>
      {next ? <EventCard event={next} /> : <Empty>{t.events.empty}</Empty>}
      <SectionTitle>{t.announcements.title}</SectionTitle>
      {news.length === 0 ? <Empty>{t.announcements.empty}</Empty> : null}
      {news.map((a) => (
        <View key={a.id} style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.md, gap: space.xs }}>
          <Text style={type.caption}>{formatTrDateTime(a.created_at).slice(0, 10)}</Text>
          <Text style={type.heading}>{a.title}</Text>
          <Text style={type.body}>{a.body}</Text>
        </View>
      ))}
    </Screen>
  );
}
