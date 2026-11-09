import { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { DateTimeField } from '@/components/DateTimeField';
import { Screen } from '@/components/Screen';
import { Button, ErrorText, Field } from '@/components/ui';
import { t } from '@/i18n/tr';
import { confirm } from '@/lib/confirm';
import { parseLink } from '@/lib/links';
import { singleFlight } from '@/lib/singleFlight';
import { supabase } from '@/lib/supabase';
import type { Offer } from '@/lib/types';
import { colors, radius, space, type } from '@/theme';

const pad = (n: number) => String(n).padStart(2, '0');
const toDateString = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function ManageOffers() {
  const [items, setItems] = useState<Offer[]>([]);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [sponsor, setSponsor] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [validUntil, setValidUntil] = useState<Date | null>(null);
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
    setError('');
  }

  function startEdit(o: Offer) {
    setEditing(o);
    setSponsor(o.sponsor);
    setTitle(o.title);
    setDescription(o.description ?? '');
    setLink(o.link ?? '');
    setValidUntil(o.valid_until ? new Date(`${o.valid_until}T12:00:00`) : null);
    setError('');
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
          const row = {
            sponsor: sponsor.trim(),
            title: title.trim(),
            description: description.trim() || null,
            link: parsed.url,
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
    [sponsor, title, description, link, validUntil, editing, load],
  );

  async function remove(o: Offer) {
    if (!(await confirm(t.admin.deleteConfirm, o.title))) return;
    await supabase.from('offers').delete().eq('id', o.id);
    if (editing?.id === o.id) reset();
    await load();
  }

  return (
    <Screen>
      {items.map((o) => (
        <View key={o.id} style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.md, gap: space.sm }}>
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
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button title={editing ? t.admin.update : t.admin.create} onPress={() => submit()} disabled={busy} />
      {editing ? <Button title={t.common.cancel} variant="secondary" onPress={reset} /> : null}
    </Screen>
  );
}
