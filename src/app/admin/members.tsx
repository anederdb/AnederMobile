import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Empty } from '@/components/EventCard';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/ui';
import { t } from '@/i18n/tr';
import { confirm } from '@/lib/confirm';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
import { colors, radius, space, type } from '@/theme';

export default function PendingMembers() {
  const [pending, setPending] = useState<Profile[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').eq('status', 'pending').order('created_at');
    setPending((data as Profile[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(p: Profile) {
    await supabase.from('profiles').update({ status: 'approved' }).eq('id', p.id);
    await load();
  }

  async function reject(p: Profile) {
    if (!(await confirm(t.admin.reject, `${p.full_name ?? ''}\n${t.admin.rejectConfirm}`))) return;
    await supabase.functions.invoke('delete-account', { body: { userId: p.id } });
    await load();
  }

  return (
    <Screen>
      {pending.length === 0 ? <Empty>{t.admin.noPending}</Empty> : null}
      {pending.map((p) => (
        <View key={p.id} style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.md, gap: space.sm }}>
          <Text style={type.heading}>{p.full_name}</Text>
          <Text style={type.caption}>{p.phone}</Text>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <View style={{ flex: 1 }}>
              <Button title={t.admin.approve} onPress={() => approve(p)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title={t.admin.reject} variant="danger" onPress={() => reject(p)} />
            </View>
          </View>
        </View>
      ))}
    </Screen>
  );
}
