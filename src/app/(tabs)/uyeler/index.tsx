import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Screen } from '@/components/Screen';
import { TitleLabel } from '@/components/TitleLabel';
import { Card, EmptyState, Field, ListGroup, ListRow, Skeleton } from '@/components/ui';
import { t } from '@/i18n/tr';
import { matchesMember } from '@/lib/memberSearch';
import { supabase } from '@/lib/supabase';
import type { Firm, Profile } from '@/lib/types';
import { colors, space, type } from '@/theme';

type Row = { profile: Profile; firms: string[] };

export default function Members() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [people, firms] = await Promise.all([
          supabase.from('profiles').select('*').eq('status', 'approved').order('full_name'),
          supabase.from('firms').select('owner_id, name'),
        ]);
        const byOwner = new Map<string, string[]>();
        for (const f of (firms.data as Pick<Firm, 'owner_id' | 'name'>[]) ?? []) {
          byOwner.set(f.owner_id, [...(byOwner.get(f.owner_id) ?? []), f.name]);
        }
        setRows(((people.data as Profile[]) ?? []).map((profile) => ({ profile, firms: byOwner.get(profile.id) ?? [] })));
      })();
    }, []),
  );

  const visible = useMemo(
    () => (rows ?? []).filter((r) => matchesMember(query, { full_name: r.profile.full_name, firms: r.firms })),
    [rows, query],
  );

  return (
    <Screen>
      <Text style={type.display}>{t.members.title}</Text>
      <ListGroup>
        <ListRow icon="information-circle-outline" title={t.about.entry} onPress={() => router.push('/uyeler/hakkimizda')} />
      </ListGroup>
      <Field label={t.members.search} value={query} onChangeText={setQuery} autoCapitalize="none" />
      {rows === null ? (
        <>
          <Skeleton height={84} />
          <Skeleton height={84} />
          <Skeleton height={84} />
        </>
      ) : null}
      {rows && visible.length === 0 ? <EmptyState icon="search-outline" title={t.members.empty} /> : null}
      {visible.map(({ profile, firms }) => (
        <Card
          key={profile.id}
          onPress={() => router.push({ pathname: '/uyeler/[id]', params: { id: profile.id } })}
          accessibilityLabel={profile.full_name ?? undefined}
          style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Avatar url={profile.avatar_url} name={profile.full_name} size={52} />
          <View style={{ flex: 1, gap: space.xs }}>
            <Text style={type.heading}>{profile.full_name}</Text>
            <TitleLabel title={profile.title} />
            {firms.length > 0 ? <Text style={type.caption}>{firms.join(' · ')}</Text> : null}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
        </Card>
      ))}
    </Screen>
  );
}
