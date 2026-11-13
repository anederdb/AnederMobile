import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text } from 'react-native';

import { NewsCard } from '@/components/NewsCard';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/ui';
import { t } from '@/i18n/tr';
import { supabase } from '@/lib/supabase';
import type { NewsItem } from '@/lib/types';
import { type } from '@/theme';

export default function NewsList() {
  const [items, setItems] = useState<NewsItem[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data }) => setItems((data as NewsItem[]) ?? []));
    }, []),
  );

  return (
    <Screen>
      <Text style={type.display}>{t.news.title}</Text>
      {items === null ? (
        <>
          <Skeleton height={120} />
          <Skeleton height={120} />
        </>
      ) : null}
      {items && items.length === 0 ? <EmptyState icon="newspaper-outline" title={t.news.empty} /> : null}
      {items?.map((n) => (
        <NewsCard key={n.id} item={n} />
      ))}
    </Screen>
  );
}
