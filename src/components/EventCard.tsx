import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { formatTrDateTime } from '@/lib/dates';
import type { AppEvent } from '@/lib/types';
import { colors, radius, space, type } from '@/theme';

export function EventCard({ event, dimmed }: { event: AppEvent; dimmed?: boolean }) {
  const router = useRouter();
  return (
    <Pressable
        accessibilityRole="link"
        onPress={() => router.push({ pathname: '/etkinlikler/[id]', params: { id: event.id } })}
        style={({ pressed }) => ({
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: space.md,
          gap: space.xs,
          opacity: dimmed ? 0.6 : pressed ? 0.85 : 1,
          borderLeftWidth: 4,
          borderLeftColor: dimmed ? colors.border : colors.primary,
        })}>
        {event.cover_url ? (
          <Image
            source={{ uri: event.cover_url }}
            accessibilityLabel={event.title}
            contentFit="cover"
            style={{ aspectRatio: 16 / 9, borderRadius: radius.md, marginBottom: space.xs, backgroundColor: colors.border }}
          />
        ) : null}
        <Text style={[type.caption, { color: colors.primary }]}>{formatTrDateTime(event.starts_at)}</Text>
        <Text style={type.heading}>{event.title}</Text>
        {event.location ? <Text style={type.caption}>{event.location}</Text> : null}
    </Pressable>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return <Text style={[type.title, { marginTop: space.sm }]}>{children}</Text>;
}

export function Empty({ children }: { children: string }) {
  return (
    <View style={{ paddingVertical: space.md }}>
      <Text style={type.body}>{children}</Text>
    </View>
  );
}
