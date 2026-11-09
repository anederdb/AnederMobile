import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { TitleLabel } from '@/components/TitleLabel';
import { Button, Field } from '@/components/ui';
import { t } from '@/i18n/tr';
import { matchesMember } from '@/lib/memberSearch';
import { supabase } from '@/lib/supabase';
import type { Firm, Profile } from '@/lib/types';
import { colors, radius, space, type } from '@/theme';

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
      <Button title={t.about.entry} variant="secondary" onPress={() => router.push('/uyeler/hakkimizda')} />
      <Field label={t.members.search} value={query} onChangeText={setQuery} autoCapitalize="none" />
      {rows === null ? <Text style={type.caption}>{t.common.loading}</Text> : null}
      {rows && visible.length === 0 ? <Text style={type.body}>{t.members.empty}</Text> : null}
      {visible.map(({ profile, firms }) => (
        <Pressable
          key={profile.id}
          accessibilityRole="link"
          onPress={() => router.push({ pathname: '/uyeler/[id]', params: { id: profile.id } })}
          style={({ pressed }) => ({
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            padding: space.md,
            gap: space.xs,
            opacity: pressed ? 0.85 : 1,
          })}>
          <Text style={type.heading}>{profile.full_name}</Text>
          <TitleLabel title={profile.title} />
          {firms.length > 0 ? <Text style={type.caption}>{firms.join(' · ')}</Text> : null}
        </Pressable>
      ))}
    </Screen>
  );
}
