import { useCallback, useEffect, useState } from 'react';
import { Linking, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Button, ErrorText, Field } from '@/components/ui';
import { t } from '@/i18n/tr';
import { confirm } from '@/lib/confirm';
import { normalizeSahibindenUrl } from '@/lib/sahibinden';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import type { Firm } from '@/lib/types';
import { colors, radius, space, type } from '@/theme';

export default function Firms() {
  const { profile } = useSession();
  const [firms, setFirms] = useState<Firm[]>([]);
  const [editing, setEditing] = useState<Firm | null>(null);
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase.from('firms').select('*').eq('owner_id', profile.id).order('created_at');
    setFirms((data as Firm[]) ?? []);
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  function reset() {
    setEditing(null);
    setName('');
    setDistrict('');
    setLink('');
    setError('');
  }

  function startEdit(firm: Firm) {
    setEditing(firm);
    setName(firm.name);
    setDistrict(firm.district ?? '');
    setLink(firm.sahibinden_url ?? '');
    setError('');
  }

  async function submit() {
    setError('');
    if (!name.trim()) return setError(t.auth.required);
    const url = link.trim() ? normalizeSahibindenUrl(link) : null;
    if (link.trim() && !url) return setError(t.firms.sahibindenInvalid);
    const row = { name: name.trim(), district: district.trim() || null, sahibinden_url: url };
    const { error: err } = editing
      ? await supabase.from('firms').update(row).eq('id', editing.id)
      : await supabase.from('firms').insert({ ...row, owner_id: profile!.id });
    if (err) return setError(t.common.error);
    reset();
    await load();
  }

  async function remove(firm: Firm) {
    if (!(await confirm(t.firms.deleteConfirm, firm.name))) return;
    await supabase.from('firms').delete().eq('id', firm.id);
    if (editing?.id === firm.id) reset();
    await load();
  }

  return (
    <Screen>
      <Text style={type.display}>{t.firms.title}</Text>
      {firms.length === 0 ? <Text style={type.body}>{t.firms.empty}</Text> : null}
      {firms.map((firm) => (
        <View
          key={firm.id}
          style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.md, gap: space.sm }}>
          <Text style={type.heading}>{firm.name}</Text>
          {firm.district ? <Text style={type.caption}>{firm.district}</Text> : null}
          {firm.sahibinden_url ? (
            <Text
              accessibilityRole="link"
              style={{ color: colors.primary, fontWeight: '600', paddingVertical: space.xs }}
              onPress={() => Linking.openURL(firm.sahibinden_url!)}>
              {t.firms.open}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <View style={{ flex: 1 }}>
              <Button title={t.common.edit} variant="secondary" onPress={() => startEdit(firm)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title={t.common.delete} variant="danger" onPress={() => remove(firm)} />
            </View>
          </View>
        </View>
      ))}
      <Field label={t.firms.name} value={name} onChangeText={setName} autoCapitalize="words" />
      <Field label={t.firms.district} value={district} onChangeText={setDistrict} autoCapitalize="words" />
      <Field label={t.firms.sahibinden} value={link} onChangeText={setLink} keyboardType="url" />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button title={editing ? t.firms.update : t.firms.add} onPress={submit} />
      {editing ? <Button title={t.common.cancel} variant="secondary" onPress={reset} /> : null}
    </Screen>
  );
}
