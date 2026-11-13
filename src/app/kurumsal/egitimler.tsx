import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { Button, Card, EmptyState, Skeleton } from '@/components/ui';
import { t } from '@/i18n/tr';
import { supabase } from '@/lib/supabase';
import type { Training } from '@/lib/types';
import { colors, space, type } from '@/theme';

export default function Trainings() {
  const [items, setItems] = useState<Training[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      supabase
        .from('trainings')
        .select('*')
        .order('position')
        .order('created_at', { ascending: false })
        .then(({ data }) => setItems((data as Training[]) ?? []));
    }, []),
  );

  return (
    <Screen>
      <Text style={type.display}>{t.corporate.trainings}</Text>
      {items === null ? (
        <>
          <Skeleton height={110} />
          <Skeleton height={110} />
        </>
      ) : null}
      {items && items.length === 0 ? <EmptyState icon="play-circle-outline" title={t.corporate.noTrainings} /> : null}
      {items?.map((tr) => (
        <Card key={tr.id} style={{ gap: space.sm }}>
          <Text style={type.heading}>{tr.title}</Text>
          {tr.note ? <Text style={type.body}>{tr.note}</Text> : null}
          {tr.video_url ? (
            <Button
              title={t.corporate.watch}
              icon={<Ionicons name="play" size={18} color={colors.onPrimary} />}
              onPress={() => Linking.openURL(tr.video_url!)}
            />
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}
