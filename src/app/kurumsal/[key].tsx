import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/ui';
import { findSitePage } from '@/lib/sitePages';
import { supabase } from '@/lib/supabase';
import type { SitePage } from '@/lib/types';
import { type } from '@/theme';

export default function CorporatePage() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const page = findSitePage(key);
  const [body, setBody] = useState<string | null | undefined>(undefined); // undefined = loading, null = no saved text

  useEffect(() => {
    if (!page) return;
    supabase
      .from('site_pages')
      .select('body')
      .eq('key', page.key)
      .maybeSingle()
      .then(({ data }) => setBody((data as Pick<SitePage, 'body'> | null)?.body ?? null));
  }, [page]);

  if (!page) return <Redirect href="/kurumsal" />;

  return (
    <Screen>
      <Text style={type.display}>{page.title}</Text>
      {body === undefined ? <Skeleton height={160} /> : <Text style={type.body}>{body ?? page.template}</Text>}
    </Screen>
  );
}
