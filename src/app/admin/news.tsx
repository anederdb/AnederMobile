import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, type ScrollViewInstance, Text, View } from 'react-native';

import { PublishToggles } from '@/components/PublishToggles';
import { Screen } from '@/components/Screen';
import { Button, ErrorText, Field } from '@/components/ui';
import { t } from '@/i18n/tr';
import { confirm } from '@/lib/confirm';
import { uploadCover, type PickedImage } from '@/lib/cover';
import { formatTrDateTime } from '@/lib/dates';
import { describePublish, publish } from '@/lib/notify';
import { pickImages } from '@/lib/photos';
import { singleFlight } from '@/lib/singleFlight';
import { supabase } from '@/lib/supabase';
import type { NewsItem } from '@/lib/types';
import { card, colors, radius, space, type } from '@/theme';

export default function ManageNews() {
  const scroll = useRef<ScrollViewInstance>(null);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  // The photo shown in the form: an already-saved URL, a freshly picked image, or none.
  const [savedImage, setSavedImage] = useState<string | null>(null);
  const [freshImage, setFreshImage] = useState<PickedImage | null>(null);
  const [sendPush, setSendPush] = useState(true);
  const [sendEmail, setSendEmail] = useState(false); // news is frequent: e-mail is opt-in per post
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
    setItems((data as NewsItem[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function reset() {
    setEditing(null);
    setTitle('');
    setBody('');
    setSavedImage(null);
    setFreshImage(null);
    setError('');
  }

  function startEdit(n: NewsItem) {
    setEditing(n);
    setTitle(n.title);
    setBody(n.body);
    setSavedImage(n.image_url);
    setFreshImage(null);
    setError('');
    setNote('');
    scroll.current?.scrollTo({ y: 0, animated: true });
  }

  async function choosePhoto() {
    const [picked] = await pickImages(1);
    if (picked) setFreshImage(picked);
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
          let imageUrl = savedImage;
          if (freshImage) {
            try {
              imageUrl = await uploadCover(freshImage);
            } catch {
              return setError(t.admin.uploadFailed);
            }
          }
          const row = { title: title.trim(), body: body.trim(), image_url: imageUrl };
          const wasEditing = !!editing;
          const { error: err } = editing
            ? await supabase.from('news').update(row).eq('id', editing.id)
            : await supabase.from('news').insert(row);
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
    [title, body, savedImage, freshImage, editing, sendPush, sendEmail, load],
  );

  async function remove(n: NewsItem) {
    if (!(await confirm(t.admin.deleteConfirm, n.title))) return;
    await supabase.from('news').delete().eq('id', n.id);
    if (editing?.id === n.id) reset();
    await load();
  }

  const preview = freshImage?.uri ?? savedImage;

  return (
    <Screen scrollRef={scroll}>
      <Text style={type.title}>{editing ? `${t.admin.formEditing}: ${editing.title}` : t.admin.formNew}</Text>
      <Field label={t.news.titleField} value={title} onChangeText={setTitle} autoCapitalize="sentences" maxLength={200} />
      <Field
        label={t.news.bodyField}
        value={body}
        onChangeText={setBody}
        autoCapitalize="sentences"
        multiline
        style={{ minHeight: 140, textAlignVertical: 'top', paddingTop: space.sm }}
      />
      <Text style={type.label}>{t.news.photo}</Text>
      {preview ? (
        <View>
          <Image source={{ uri: preview }} contentFit="cover" style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md, backgroundColor: colors.border }} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.news.removePhoto}
            onPress={() => {
              setFreshImage(null);
              setSavedImage(null);
            }}
            hitSlop={8}
            style={{ position: 'absolute', top: 8, right: 8, backgroundColor: colors.ink, borderRadius: radius.pill, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: 18 }}>×</Text>
          </Pressable>
        </View>
      ) : null}
      <Button title={preview ? t.news.changePhoto : t.news.addPhoto} variant="secondary" onPress={choosePhoto} />
      {!editing ? <PublishToggles push={sendPush} email={sendEmail} onPush={setSendPush} onEmail={setSendEmail} /> : null}
      {error ? <ErrorText>{error}</ErrorText> : null}
      {note ? <Text accessibilityRole="alert" style={type.label}>{note}</Text> : null}
      <Button title={editing ? t.admin.update : t.admin.create} onPress={() => submit()} loading={busy} />
      {editing ? <Button title={t.common.cancel} variant="secondary" onPress={reset} /> : null}

      {items.length > 0 ? <Text style={[type.title, { marginTop: space.md }]}>{t.admin.existing}</Text> : null}
      {items.map((n) => (
        <View key={n.id} style={{ ...card, gap: space.sm }}>
          <Text style={type.caption}>{formatTrDateTime(n.created_at)}</Text>
          <Text style={type.heading}>{n.title}</Text>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <View style={{ flex: 1 }}>
              <Button title={t.common.edit} variant="secondary" onPress={() => startEdit(n)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title={t.common.delete} variant="danger" onPress={() => remove(n)} />
            </View>
          </View>
        </View>
      ))}
    </Screen>
  );
}
