import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, type ScrollViewInstance, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Button, ErrorText, Field } from '@/components/ui';
import { t } from '@/i18n/tr';
import { confirm } from '@/lib/confirm';
import { singleFlight } from '@/lib/singleFlight';
import { supabase } from '@/lib/supabase';
import { validateTraining } from '@/lib/trainings';
import type { Training } from '@/lib/types';
import { card, space, type } from '@/theme';

export default function ManageTrainings() {
  const scroll = useRef<ScrollViewInstance>(null);
  const [items, setItems] = useState<Training[]>([]);
  const [editing, setEditing] = useState<Training | null>(null);
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('trainings').select('*').order('position').order('created_at', { ascending: false });
    setItems((data as Training[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function reset() {
    setEditing(null);
    setTitle('');
    setVideoUrl('');
    setNote('');
    setError('');
  }

  function startEdit(tr: Training) {
    setEditing(tr);
    setTitle(tr.title);
    setVideoUrl(tr.video_url ?? '');
    setNote(tr.note ?? '');
    setError('');
    scroll.current?.scrollTo({ y: 0, animated: true });
  }

  const submit = useMemo(
    () =>
      singleFlight(async () => {
        setError('');
        const result = validateTraining({ title, videoUrl, note });
        if (!result.ok) return setError(result.error === 'title' ? t.auth.required : t.corporate.invalidLink);
        setBusy(true);
        try {
          const { error: err } = editing
            ? await supabase.from('trainings').update(result.value).eq('id', editing.id)
            : await supabase.from('trainings').insert(result.value);
          if (err) return setError(t.common.error);
          reset();
          await load();
        } finally {
          setBusy(false);
        }
      }),
    [title, videoUrl, note, editing, load],
  );

  async function remove(tr: Training) {
    if (!(await confirm(t.admin.deleteConfirm, tr.title))) return;
    await supabase.from('trainings').delete().eq('id', tr.id);
    if (editing?.id === tr.id) reset();
    await load();
  }

  return (
    <Screen scrollRef={scroll}>
      <Text style={type.title}>{editing ? `${t.admin.formEditing}: ${editing.title}` : t.admin.formNew}</Text>
      <Field label={t.corporate.trainingTitle} value={title} onChangeText={setTitle} autoCapitalize="sentences" maxLength={200} />
      <Field label={t.corporate.trainingLink} value={videoUrl} onChangeText={setVideoUrl} keyboardType="url" autoCapitalize="none" autoCorrect={false} />
      <Field
        label={t.corporate.trainingNote}
        value={note}
        onChangeText={setNote}
        autoCapitalize="sentences"
        multiline
        style={{ minHeight: 110, textAlignVertical: 'top', paddingTop: space.sm }}
      />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button title={editing ? t.admin.update : t.admin.create} onPress={() => submit()} loading={busy} />
      {editing ? <Button title={t.common.cancel} variant="secondary" onPress={reset} /> : null}

      {items.length > 0 ? <Text style={[type.title, { marginTop: space.md }]}>{t.admin.existing}</Text> : null}
      {items.map((tr) => (
        <View key={tr.id} style={{ ...card, gap: space.sm }}>
          <Text style={type.heading}>{tr.title}</Text>
          {tr.video_url ? <Text style={type.caption}>{tr.video_url}</Text> : null}
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <View style={{ flex: 1 }}>
              <Button title={t.common.edit} variant="secondary" onPress={() => startEdit(tr)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title={t.common.delete} variant="danger" onPress={() => remove(tr)} />
            </View>
          </View>
        </View>
      ))}
    </Screen>
  );
}
