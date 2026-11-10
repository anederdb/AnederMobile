import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, type ScrollViewInstance, Text, View } from 'react-native';

import { DateTimeField } from '@/components/DateTimeField';
import { Screen } from '@/components/Screen';
import { Button, ErrorText, Field } from '@/components/ui';
import { t } from '@/i18n/tr';
import { confirm } from '@/lib/confirm';
import { uploadCover, type PickedImage } from '@/lib/cover';
import { parseLink } from '@/lib/links';
import { pickImages } from '@/lib/photos';
import { singleFlight } from '@/lib/singleFlight';
import { supabase } from '@/lib/supabase';
import type { Offer } from '@/lib/types';
import { card, colors, radius, space, type } from '@/theme';

const pad = (n: number) => String(n).padStart(2, '0');
const toDateString = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function ManageOffers() {
  const scroll = useRef<ScrollViewInstance>(null);
  const [items, setItems] = useState<Offer[]>([]);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [sponsor, setSponsor] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [validUntil, setValidUntil] = useState<Date | null>(null);
  // The photo shown in the form: an already-saved URL, a freshly picked image, or none.
  const [savedImage, setSavedImage] = useState<string | null>(null);
  const [freshImage, setFreshImage] = useState<PickedImage | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('offers').select('*').order('created_at', { ascending: false });
    setItems((data as Offer[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function reset() {
    setEditing(null);
    setSponsor('');
    setTitle('');
    setDescription('');
    setLink('');
    setValidUntil(null);
    setSavedImage(null);
    setFreshImage(null);
    setError('');
  }

  function startEdit(o: Offer) {
    setEditing(o);
    setSponsor(o.sponsor);
    setTitle(o.title);
    setDescription(o.description ?? '');
    setLink(o.link ?? '');
    setValidUntil(o.valid_until ? new Date(`${o.valid_until}T12:00:00`) : null);
    setSavedImage(o.image_url);
    setFreshImage(null);
    setError('');
    scroll.current?.scrollTo({ y: 0, animated: true });
  }

  async function choosePhoto() {
    const [picked] = await pickImages(1);
    if (picked) setFreshImage(picked);
  }

  const submit = useMemo(
    () =>
      singleFlight(async () => {
        setError('');
        if (!sponsor.trim() || !title.trim()) return setError(t.auth.required);
        const parsed = parseLink(link);
        if (!parsed.ok) return setError(t.listings.invalidLink);
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
          const row = {
            sponsor: sponsor.trim(),
            title: title.trim(),
            description: description.trim() || null,
            link: parsed.url,
            image_url: imageUrl,
            valid_until: validUntil ? toDateString(validUntil) : null,
          };
          const { error: err } = editing
            ? await supabase.from('offers').update(row).eq('id', editing.id)
            : await supabase.from('offers').insert(row);
          if (err) return setError(t.common.error);
          reset();
          await load();
        } finally {
          setBusy(false);
        }
      }),
    [sponsor, title, description, link, validUntil, savedImage, freshImage, editing, load],
  );

  async function remove(o: Offer) {
    if (!(await confirm(t.admin.deleteConfirm, o.title))) return;
    await supabase.from('offers').delete().eq('id', o.id);
    if (editing?.id === o.id) reset();
    await load();
  }

  const preview = freshImage?.uri ?? savedImage;

  return (
    <Screen scrollRef={scroll}>
      <Text style={type.title}>{editing ? `${t.admin.formEditing}: ${editing.title}` : t.admin.formNew}</Text>
      <Field label={t.offers.sponsor} value={sponsor} onChangeText={setSponsor} autoCapitalize="words" />
      <Field label={t.offers.titleField} value={title} onChangeText={setTitle} autoCapitalize="sentences" />
      <Field
        label={t.offers.description}
        value={description}
        onChangeText={setDescription}
        autoCapitalize="sentences"
        multiline
        style={{ minHeight: 96, textAlignVertical: 'top', paddingTop: space.sm }}
      />
      <Field label={t.listings.link} value={link} onChangeText={setLink} keyboardType="url" autoCapitalize="none" autoCorrect={false} />
      <DateTimeField label={t.offers.validUntil} value={validUntil} onChange={setValidUntil} />
      {validUntil ? <Button title={t.offers.clearDate} variant="secondary" onPress={() => setValidUntil(null)} /> : null}
      <Text style={type.label}>{t.offers.photo}</Text>
      {preview ? (
        <View>
          <Image source={{ uri: preview }} contentFit="cover" style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md, backgroundColor: colors.border }} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.offers.removePhoto}
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
      <Button title={preview ? t.offers.changePhoto : t.offers.addPhoto} variant="secondary" onPress={choosePhoto} />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button title={editing ? t.admin.update : t.admin.create} onPress={() => submit()} loading={busy} />
      {editing ? <Button title={t.common.cancel} variant="secondary" onPress={reset} /> : null}

      {items.length > 0 ? <Text style={[type.title, { marginTop: space.md }]}>{t.admin.existing}</Text> : null}
      {items.map((o) => (
        <View key={o.id} style={{ ...card, gap: space.sm }}>
          <Text style={type.caption}>{o.sponsor}</Text>
          <Text style={type.heading}>{o.title}</Text>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <View style={{ flex: 1 }}>
              <Button title={t.common.edit} variant="secondary" onPress={() => startEdit(o)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title={t.common.delete} variant="danger" onPress={() => remove(o)} />
            </View>
          </View>
        </View>
      ))}
    </Screen>
  );
}
