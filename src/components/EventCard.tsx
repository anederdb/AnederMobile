import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Card, EmptyState, SectionHeader } from '@/components/ui';
import { trDateParts } from '@/lib/dates';
import type { AppEvent } from '@/lib/types';
import { colors, radius, space, type } from '@/theme';

export function EventCard({ event, dimmed }: { event: AppEvent; dimmed?: boolean }) {
  const router = useRouter();
  const { day, month, time } = trDateParts(event.starts_at);
  const accent = dimmed ? colors.muted : colors.primary;
  return (
    <Card
      onPress={() => router.push({ pathname: '/etkinlikler/[id]', params: { id: event.id } })}
      accessibilityLabel={event.title}
      style={{ padding: 0, opacity: dimmed ? 0.75 : 1 }}>
      {event.cover_url ? (
        <Image
          source={{ uri: event.cover_url }}
          accessibilityLabel={event.title}
          contentFit="cover"
          style={{ aspectRatio: 16 / 9, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, backgroundColor: colors.border }}
        />
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md }}>
        <View
          style={{
            width: 56,
            height: 60,
            borderRadius: radius.md,
            backgroundColor: dimmed ? colors.surfaceMuted : colors.primaryTint,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: accent, textTransform: 'uppercase' }}>{month}</Text>
          <Text style={{ fontSize: 24, lineHeight: 28, fontWeight: '800', color: accent }}>{day}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={type.heading}>{event.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="time-outline" size={14} color={colors.muted} />
            <Text style={type.caption}>{time}</Text>
          </View>
          {event.location ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="location-outline" size={14} color={colors.muted} />
              <Text style={[type.caption, { flex: 1 }]}>{event.location}</Text>
            </View>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
      </View>
    </Card>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return <SectionHeader title={children} />;
}

export function Empty({ children }: { children: string }) {
  return <EmptyState icon="file-tray-outline" title={children} />;
}
