import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { DateTimeField } from '@/components/DateTimeField';
import { Screen } from '@/components/Screen';
import { Button, ErrorText, Field } from '@/components/ui';
import { t } from '@/i18n/tr';
import { confirm } from '@/lib/confirm';
import { uploadCover, type PickedImage } from '@/lib/cover';
import { formatTrDateTime } from '@/lib/dates';
import { pickImages } from '@/lib/photos';
import { singleFlight } from '@/lib/singleFlight';
import { supabase } from '@/lib/supabase';
import type { AppEvent, EventPhoto } from '@/lib/types';
import { colors, radius, space, type } from '@/theme';

const MAX_PHOTOS = 10;

export default function ManageEvents() {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [editing, setEditing] = useState<AppEvent | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [existing, setExisting] = useState<EventPhoto[]>([]);
  const [fresh, setFresh] = useState<PickedImage[]>([]);
  const [notify, setNotify] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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
    setDate(null);
    setExisting([]);
    setFresh([]);
    setNotify(false);
    setError('');
  }

  async function startEdit(e: AppEvent) {
    setEditing(e);
    setTitle(e.title);
    setDescription(e.description ?? '');
    setLocation(e.location ?? '');
    setDate(new Date(e.starts_at));
    setFresh([]);
    setError('');
    const { data } = await supabase.from('event_photos').select('*').eq('event_id', e.id).order('position');
    setExisting((data as EventPhoto[]) ?? []);
  }

  async function addPhotos() {
    const room = MAX_PHOTOS - existing.length - fresh.length;
    if (room <= 0) return setError(t.admin.maxEventPhotos);
    const picked = await pickImages(room);
    setFresh((prev) => [...prev, ...picked].slice(0, MAX_PHOTOS - existing.length));
  }

  // singleFlight: a second tap while the first save is still running does nothing (this was the double post).
  const submit = useMemo(
    () =>
      singleFlight(async () => {
        setError('');
        if (!title.trim()) return setError(t.auth.required);
        if (!date) return setError(t.admin.dateInvalid);
        setBusy(true);
        try {
          let uploaded: string[] = [];
          try {
            uploaded = await Promise.all(fresh.map((img) => uploadCover(img)));
          } catch {
            return setError(t.admin.uploadFailed);
          }
          const cover = existing[0]?.url ?? uploaded[0] ?? null;
          const row = {
            title: title.trim(),
            description: description.trim() || null,
            location: location.trim() || null,
            starts_at: date.toISOString(),
            cover_url: cover,
          };
          let eventId: string;
          if (editing) {
            const { error: err } = await supabase.from('events').update(row).eq('id', editing.id);
            if (err) return setError(t.common.error);
            eventId = editing.id;
            const keep = existing.map((p) => p.id);
            const { data: all } = await supabase.from('event_photos').select('id').eq('event_id', eventId);
            const drop = ((all as { id: string }[]) ?? []).map((p) => p.id).filter((pid) => !keep.includes(pid));
            if (drop.length) await supabase.from('event_photos').delete().in('id', drop);
          } else {
            const { data, error: err } = await supabase.from('events').insert(row).select('id').single();
            if (err) return setError(t.common.error);
            eventId = data.id;
            if (notify) {
              await supabase.functions.invoke('send-push', {
                body: {
                  title: row.title,
                  body: [formatTrDateTime(row.starts_at), row.location].filter(Boolean).join(' · '),
                  eventId,
                },
              });
            }
          }
          if (uploaded.length) {
            const start = existing.length ? Math.max(...existing.map((p) => p.position)) + 1 : 0;
            const { error: photoErr } = await supabase
              .from('event_photos')
              .insert(uploaded.map((url, i) => ({ event_id: eventId, url, position: start + i })));
            if (photoErr) return setError(t.common.error);
          }
          reset();
          await load();
        } finally {
          setBusy(false);
        }
      }),
    [title, description, location, date, fresh, existing, editing, notify, load],
  );

  async function remove(e: AppEvent) {
    if (!(await confirm(t.admin.deleteConfirm, e.title))) return;
    await supabase.from('events').delete().eq('id', e.id);
    if (editing?.id === e.id) reset();
    await load();
  }

  const thumbs = [
    ...existing.map((p) => ({ key: p.id, uri: p.url, remove: () => setExisting((cur) => cur.filter((x) => x.id !== p.id)) })),
    ...fresh.map((img, i) => ({ key: img.uri, uri: img.uri, remove: () => setFresh((cur) => cur.filter((_, j) => j !== i)) })),
  ];

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
      <Field label={t.admin.eventTitle} value={title} onChangeText={setTitle} autoCapitalize="sentences" />
      <DateTimeField label={t.admin.eventDate} value={date} onChange={setDate} />
      <Field label={t.admin.eventLocation} value={location} onChangeText={setLocation} autoCapitalize="sentences" />
      <Field
        label={t.admin.eventDescription}
        value={description}
        onChangeText={setDescription}
        autoCapitalize="sentences"
        multiline
        style={{ minHeight: 96, textAlignVertical: 'top', paddingTop: space.sm }}
      />
      {thumbs.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {thumbs.map((th) => (
            <View key={th.key}>
              <Image source={{ uri: th.uri }} contentFit="cover" style={{ width: 88, height: 88, borderRadius: radius.md, backgroundColor: colors.border }} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.admin.removePhoto}
                onPress={th.remove}
                hitSlop={8}
                style={{ position: 'absolute', top: 4, right: 4, backgroundColor: colors.ink, borderRadius: radius.pill, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
      <Button title={t.admin.addPhotos} variant="secondary" onPress={addPhotos} />
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
      <Button title={editing ? t.admin.update : t.admin.create} onPress={() => submit()} disabled={busy} />
      {editing ? <Button title={t.common.cancel} variant="secondary" onPress={reset} /> : null}
    </Screen>
  );
}
