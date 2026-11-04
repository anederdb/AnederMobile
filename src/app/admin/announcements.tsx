import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Button, ErrorText, Field } from '@/components/ui';
import { t } from '@/i18n/tr';
import { confirm } from '@/lib/confirm';
import { formatTrDateTime } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import type { Announcement } from '@/lib/types';
import { colors, radius, space, type } from '@/theme';

export default function ManageAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    setItems((data as Announcement[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function reset() {
    setEditing(null);
    setTitle('');
    setBody('');
    setError('');
  }

  function startEdit(a: Announcement) {
    setEditing(a);
    setTitle(a.title);
    setBody(a.body);
    setError('');
  }

  async function submit() {
    setError('');
    if (!title.trim() || !body.trim()) return setError(t.auth.required);
    const row = { title: title.trim(), body: body.trim() };
    const { error: err } = editing
      ? await supabase.from('announcements').update(row).eq('id', editing.id)
      : await supabase.from('announcements').insert(row);
    if (err) return setError(t.common.error);
    reset();
    await load();
  }

  async function remove(a: Announcement) {
    if (!(await confirm(t.admin.deleteConfirm, a.title))) return;
    await supabase.from('announcements').delete().eq('id', a.id);
    if (editing?.id === a.id) reset();
    await load();
  }

  return (
    <Screen>
      {items.map((a) => (
        <View key={a.id} style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.md, gap: space.sm }}>
          <Text style={type.caption}>{formatTrDateTime(a.created_at)}</Text>
          <Text style={type.heading}>{a.title}</Text>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <View style={{ flex: 1 }}>
              <Button title={t.common.edit} variant="secondary" onPress={() => startEdit(a)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title={t.common.delete} variant="danger" onPress={() => remove(a)} />
            </View>
          </View>
        </View>
      ))}
      <Field label={t.admin.announcementTitle} value={title} onChangeText={setTitle} autoCapitalize="sentences" />
      <Field
        label={t.admin.announcementBody}
        value={body}
        onChangeText={setBody}
        autoCapitalize="sentences"
        multiline
        style={{ minHeight: 120, textAlignVertical: 'top', paddingTop: space.sm }}
      />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button title={editing ? t.admin.update : t.admin.create} onPress={submit} />
      {editing ? <Button title={t.common.cancel} variant="secondary" onPress={reset} /> : null}
    </Screen>
  );
}
