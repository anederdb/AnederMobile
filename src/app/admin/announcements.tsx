import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, type ScrollViewInstance, Text, View } from 'react-native';

import { PublishToggles } from '@/components/PublishToggles';
import { Screen } from '@/components/Screen';
import { Button, ErrorText, Field } from '@/components/ui';
import { t } from '@/i18n/tr';
import { confirm } from '@/lib/confirm';
import { formatTrDateTime } from '@/lib/dates';
import { describePublish, publish } from '@/lib/notify';
import { singleFlight } from '@/lib/singleFlight';
import { supabase } from '@/lib/supabase';
import type { Announcement } from '@/lib/types';
import { card, space, type } from '@/theme';

export default function ManageAnnouncements() {
  const scroll = useRef<ScrollViewInstance>(null);
  const [items, setItems] = useState<Announcement[]>([]);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [sendPush, setSendPush] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

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
    scroll.current?.scrollTo({ y: 0, animated: true });
  }

  // singleFlight: a second tap while the first save is running does nothing.
  const submit = useMemo(
    () =>
      singleFlight(async () => {
        setError('');
        setNote('');
        if (!title.trim() || !body.trim()) return setError(t.auth.required);
        setBusy(true);
        try {
          const row = { title: title.trim(), body: body.trim() };
          const wasEditing = !!editing;
          const { error: err } = editing
            ? await supabase.from('announcements').update(row).eq('id', editing.id)
            : await supabase.from('announcements').insert(row);
          if (err) return setError(t.common.error);
          reset();
          setNote(t.admin.publishedNote);
          await load();
          if (!wasEditing && (sendPush || sendEmail)) {
            // After the post is saved: a failed channel is reported, never undone.
            const result = await publish({ title: row.title, body: row.body, push: sendPush, email: sendEmail });
            setNote(`${t.admin.publishedNote} ${describePublish(result, t.admin.publishLabels)}`);
          }
        } finally {
          setBusy(false);
        }
      }),
    [title, body, editing, sendPush, sendEmail, load],
  );

  async function remove(a: Announcement) {
    if (!(await confirm(t.admin.deleteConfirm, a.title))) return;
    await supabase.from('announcements').delete().eq('id', a.id);
    if (editing?.id === a.id) reset();
    await load();
  }

  return (
    <Screen scrollRef={scroll}>
      <Text style={type.title}>{editing ? `${t.admin.formEditing}: ${editing.title}` : t.admin.formNew}</Text>
      <Field label={t.admin.announcementTitle} value={title} onChangeText={setTitle} autoCapitalize="sentences" />
      <Field
        label={t.admin.announcementBody}
        value={body}
        onChangeText={setBody}
        autoCapitalize="sentences"
        multiline
        style={{ minHeight: 120, textAlignVertical: 'top', paddingTop: space.sm }}
      />
      {!editing ? <PublishToggles push={sendPush} email={sendEmail} onPush={setSendPush} onEmail={setSendEmail} /> : null}
      {error ? <ErrorText>{error}</ErrorText> : null}
      {note ? <Text accessibilityRole="alert" style={type.label}>{note}</Text> : null}
      <Button title={editing ? t.admin.update : t.admin.create} onPress={() => submit()} loading={busy} />
      {editing ? <Button title={t.common.cancel} variant="secondary" onPress={reset} /> : null}

      {items.length > 0 ? <Text style={[type.title, { marginTop: space.md }]}>{t.admin.existing}</Text> : null}
      {items.map((a) => (
        <View key={a.id} style={{ ...card, gap: space.sm }}>
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
    </Screen>
  );
}
