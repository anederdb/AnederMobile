import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { Switch, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Button, ErrorText, Field } from '@/components/ui';
import { t } from '@/i18n/tr';
import { confirm } from '@/lib/confirm';
import { pickImage, uploadCover, type PickedImage } from '@/lib/cover';
import { formatTrDateTime, parseTrDateTime } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import type { AppEvent } from '@/lib/types';
import { colors, radius, space, type } from '@/theme';

export default function ManageEvents() {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [editing, setEditing] = useState<AppEvent | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [cover, setCover] = useState<string | null>(null);
  const [picked, setPicked] = useState<PickedImage | null>(null);
  const [notify, setNotify] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('events').select('*').order('starts_at', { ascending: false });
    setEvents((data as AppEvent[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function reset() {
    setEditing(null);
    setTitle('');
    setDescription('');
    setLocation('');
    setDate('');
    setCover(null);
    setPicked(null);
    setNotify(false);
    setError('');
  }

  function startEdit(e: AppEvent) {
    setEditing(e);
    setTitle(e.title);
    setDescription(e.description ?? '');
    setLocation(e.location ?? '');
    setDate(formatTrDateTime(e.starts_at));
    setCover(e.cover_url);
    setPicked(null);
    setError('');
  }

  async function submit() {
    setError('');
    if (!title.trim()) return setError(t.auth.required);
    const startsAt = parseTrDateTime(date);
    if (!startsAt) return setError(t.admin.dateInvalid);
    let coverUrl = cover;
    if (picked) {
      try {
        coverUrl = await uploadCover(picked);
      } catch {
        return setError(t.admin.uploadFailed);
      }
    }
    const row = {
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      starts_at: startsAt,
      cover_url: coverUrl,
    };
    if (editing) {
      const { error: err } = await supabase.from('events').update(row).eq('id', editing.id);
      if (err) return setError(t.common.error);
    } else {
      const { data, error: err } = await supabase.from('events').insert(row).select('id').single();
      if (err) return setError(t.common.error);
      if (notify) {
        await supabase.functions.invoke('send-push', {
          body: { title: row.title, body: [date.trim(), row.location].filter(Boolean).join(' · '), eventId: data.id },
        });
      }
    }
    reset();
    await load();
  }

  async function remove(e: AppEvent) {
    if (!(await confirm(t.admin.deleteConfirm, e.title))) return;
    await supabase.from('events').delete().eq('id', e.id);
    if (editing?.id === e.id) reset();
    await load();
  }

  return (
    <Screen>
      {events.map((e) => (
        <View key={e.id} style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.md, gap: space.sm }}>
          <Text style={[type.caption, { color: colors.primary }]}>{formatTrDateTime(e.starts_at)}</Text>
          <Text style={type.heading}>{e.title}</Text>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <View style={{ flex: 1 }}>
              <Button title={t.common.edit} variant="secondary" onPress={() => startEdit(e)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title={t.common.delete} variant="danger" onPress={() => remove(e)} />
            </View>
          </View>
        </View>
      ))}
      {picked?.uri || cover ? (
        <Image
          source={{ uri: picked?.uri ?? cover! }}
          contentFit="cover"
          style={{ aspectRatio: 16 / 9, borderRadius: radius.md, backgroundColor: colors.border }}
        />
      ) : null}
      <Button
        title={picked || cover ? t.admin.changePhoto : t.admin.pickPhoto}
        variant="secondary"
        onPress={async () => {
          const image = await pickImage();
          if (image) setPicked(image);
        }}
      />
      {picked || cover ? (
        <Button
          title={t.admin.removePhoto}
          variant="secondary"
          onPress={() => {
            setPicked(null);
            setCover(null);
          }}
        />
      ) : null}
      <Field label={t.admin.eventTitle} value={title} onChangeText={setTitle} autoCapitalize="sentences" />
      <Field label={t.admin.eventDate} value={date} onChangeText={setDate} placeholder="21.12.2023 13:04" />
      <Field label={t.admin.eventLocation} value={location} onChangeText={setLocation} autoCapitalize="sentences" />
      <Field
        label={t.admin.eventDescription}
        value={description}
        onChangeText={setDescription}
        autoCapitalize="sentences"
        multiline
        style={{ minHeight: 96, textAlignVertical: 'top', paddingTop: space.sm }}
      />
      {!editing ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md }}>
          <Text style={[type.body, { flex: 1 }]}>{t.admin.notifyOnPublish}</Text>
          <Switch
            value={notify}
            onValueChange={setNotify}
            accessibilityLabel={t.admin.notifyOnPublish}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
      ) : null}
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button title={editing ? t.admin.update : t.admin.create} onPress={submit} />
      {editing ? <Button title={t.common.cancel} variant="secondary" onPress={reset} /> : null}
    </Screen>
  );
}
