import { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Empty } from '@/components/EventCard';
import { Screen } from '@/components/Screen';
import { Button, Chip, ErrorText, Field } from '@/components/ui';
import { t } from '@/i18n/tr';
import { confirm } from '@/lib/confirm';
import { useSession } from '@/lib/session';
import { singleFlight } from '@/lib/singleFlight';
import { supabase } from '@/lib/supabase';
import { TITLE_SUGGESTIONS } from '@/lib/titles';
import type { Profile } from '@/lib/types';
import { colors, radius, space, type } from '@/theme';

const ROLES = ['member', 'scanner', 'admin'] as const;

function MemberRoleEditor({ member, isSelf, onSaved }: { member: Profile; isSelf: boolean; onSaved: () => void }) {
  const [role, setRole] = useState<Profile['role']>(member.role);
  const [title, setTitle] = useState(member.title ?? '');
  const [error, setError] = useState('');
  const save = useMemo(
    () =>
      singleFlight(async () => {
        setError('');
        const { error: err } = await supabase
          .from('profiles')
          .update({ role, title: title.trim() || null })
          .eq('id', member.id);
        if (err) return setError(t.common.error);
        onSaved();
      }),
    [role, title, member.id, onSaved],
  );
  const changed = role !== member.role || (title.trim() || null) !== member.title;
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.md, gap: space.sm }}>
      <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
        <Avatar url={member.avatar_url} name={member.full_name} size={48} />
        <Text style={type.heading}>{member.full_name}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
        {ROLES.map((r) => (
          <Chip key={r} label={t.profile.role[r]} selected={role === r} onPress={() => !(isSelf && r !== 'admin') && setRole(r)} />
        ))}
      </View>
      <Field label={t.admin.titleField} value={title} onChangeText={setTitle} autoCapitalize="sentences" maxLength={60} />
      <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
        {TITLE_SUGGESTIONS.map((s) => (
          <Chip key={s} label={s} selected={title === s} onPress={() => setTitle(title === s ? '' : s)} />
        ))}
      </View>
      {isSelf ? <Text style={type.caption}>{t.admin.selfRoleHint}</Text> : null}
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button title={t.common.save} onPress={() => save()} disabled={!changed} />
    </View>
  );
}

export default function PendingMembers() {
  const { profile: me } = useSession();
  const [pending, setPending] = useState<Profile[]>([]);
  const [approved, setApproved] = useState<Profile[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').eq('status', 'pending').order('created_at');
    setPending((data as Profile[]) ?? []);
    const { data: ok } = await supabase.from('profiles').select('*').eq('status', 'approved').order('full_name');
    setApproved((ok as Profile[]) ?? []);
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
          <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
            <Avatar url={p.avatar_url} name={p.full_name} size={64} />
            <View style={{ flex: 1 }}>
              <Text style={type.heading}>{p.full_name}</Text>
              <Text style={type.caption}>{p.phone}</Text>
            </View>
          </View>
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
      <Text style={[type.title, { marginTop: space.md }]}>{t.admin.roles}</Text>
      {approved.map((m) => (
        <MemberRoleEditor key={`${m.id}:${m.role}:${m.title ?? ''}`} member={m} isSelf={m.id === me?.id} onSaved={load} />
      ))}
    </Screen>
  );
}
