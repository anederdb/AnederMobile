import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/ui';
import { t } from '@/i18n/tr';
import { formatTrDateTime } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import type { NewsItem } from '@/lib/types';
import { colors, radius, type } from '@/theme';

export default function NewsDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<NewsItem | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    supabase
      .from('news')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => setItem((data as NewsItem | null) ?? null));
  }, [id]);

  if (item === undefined) {
    return (
      <Screen>
        <Skeleton height={200} />
        <Skeleton height={36} />
        <Skeleton height={120} />
      </Screen>
    );
  }
  if (item === null) {
    return (
      <Screen>
        <EmptyState icon="newspaper-outline" title={t.news.empty} />
      </Screen>
    );
  }

  return (
    <Screen>
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          contentFit="cover"
          accessibilityLabel={item.title}
          style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: radius.xl, backgroundColor: colors.border }}
        />
      ) : null}
      <Text style={type.caption}>{formatTrDateTime(item.created_at).slice(0, 10)}</Text>
      <Text style={type.display}>{item.title}</Text>
      <Text style={type.body}>{item.body}</Text>
    </Screen>
  );
}
