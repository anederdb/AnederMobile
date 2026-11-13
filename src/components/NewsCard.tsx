import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Card } from '@/components/ui';
import { formatTrDateTime } from '@/lib/dates';
import type { NewsItem } from '@/lib/types';
import { colors, radius, space, type } from '@/theme';

/** One news item: optional 16:9 photo, date, title and a short preview. Opens the full item. */
export function NewsCard({ item }: { item: NewsItem }) {
  const router = useRouter();
  return (
    <Card onPress={() => router.push({ pathname: '/haberler/[id]', params: { id: item.id } })} accessibilityLabel={item.title} style={{ padding: 0 }}>
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          contentFit="cover"
          accessibilityLabel={item.title}
          style={{ width: '100%', aspectRatio: 16 / 9, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, backgroundColor: colors.border }}
        />
      ) : null}
      <View style={{ padding: space.md, gap: space.xs }}>
        <Text style={type.caption}>{formatTrDateTime(item.created_at).slice(0, 10)}</Text>
        <Text style={type.heading}>{item.title}</Text>
        <Text style={type.body} numberOfLines={3}>
          {item.body}
        </Text>
      </View>
    </Card>
  );
}
