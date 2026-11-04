import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Button, Chip, ErrorText, Field } from '@/components/ui';
import { t } from '@/i18n/tr';
import type { PickedImage } from '@/lib/cover';
import { ANKARA_DISTRICTS, ROOM_OPTIONS } from '@/lib/districts';
import { pickImages, removeListingPhotos, signedUrls, uploadListingPhoto } from '@/lib/photos';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import type { Firm, Listing } from '@/lib/types';
import { colors, radius, space, type } from '@/theme';

const MAX_PHOTOS = 8;

export default function ListingForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { profile } = useSession();

  const [kind, setKind] = useState<'satilik' | 'kiralik'>('satilik');
  const [title, setTitle] = useState('');
  const [district, setDistrict] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [price, setPrice] = useState('');
  const [rooms, setRooms] = useState('');
  const [area, setArea] = useState('');
  const [description, setDescription] = useState('');
  const [firmId, setFirmId] = useState<string | null>(null);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [existing, setExisting] = useState<string[]>([]);
  const [existingOriginal, setExistingOriginal] = useState<string[]>([]);
  const [fresh, setFresh] = useState<PickedImage[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('firms')
      .select('*')
      .eq('owner_id', profile.id)
      .order('created_at')
      .then(({ data }) => setFirms((data as Firm[]) ?? []));
  }, [profile]);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(async ({ data }) => {
        const l = data as Listing | null;
        if (!l) return;
        setKind(l.type);
        setTitle(l.title);
        setDistrict(l.district ?? '');
        setNeighborhood(l.neighborhood ?? '');
        setPrice(l.price != null ? String(l.price) : '');
        setRooms(l.rooms ?? '');
        setArea(l.area_m2 != null ? String(l.area_m2) : '');
        setDescription(l.description ?? '');
        setFirmId(l.firm_id);
        setExisting(l.photos);
        setExistingOriginal(l.photos);
        setUrls(await signedUrls(l.photos));
      });
  }, [id]);

  async function addPhotos() {
    const room = MAX_PHOTOS - existing.length - fresh.length;
    if (room <= 0) return setError(t.listings.maxPhotos);
    const picked = await pickImages(room);
    setFresh((prev) => [...prev, ...picked].slice(0, MAX_PHOTOS - existing.length));
  }

  async function submit() {
    setError('');
    if (!title.trim()) return setError(t.auth.required);
    const priceNum = price.trim() ? Number(price.replace(/\./g, '').replace(',', '.')) : null;
    const areaNum = area.trim() ? Number(area.replace(',', '.')) : null;
    if ((priceNum !== null && !Number.isFinite(priceNum)) || (areaNum !== null && !Number.isFinite(areaNum))) {
      return setError(t.listings.invalidNumber);
    }
    setBusy(true);
    let uploaded: string[] = [];
    try {
      uploaded = await Promise.all(fresh.map((img) => uploadListingPhoto(profile!.id, img)));
    } catch {
      setBusy(false);
      return setError(t.listings.uploadFailed);
    }
    const row = {
      type: kind,
      title: title.trim(),
      district: district || null,
      neighborhood: neighborhood.trim() || null,
      price: priceNum,
      rooms: rooms || null,
      area_m2: areaNum,
      description: description.trim() || null,
      firm_id: firmId,
      photos: [...existing, ...uploaded],
    };
    const result = id
      ? await supabase.from('listings').update(row).eq('id', id).select('id').single()
      : await supabase.from('listings').insert({ ...row, owner_id: profile!.id }).select('id').single();
    setBusy(false);
    if (result.error) return setError(t.common.error);
    await removeListingPhotos(existingOriginal.filter((p) => !existing.includes(p)));
    router.replace({ pathname: '/ilanlar/[id]', params: { id: result.data.id } });
  }

  const thumbs = [
    ...existing.map((p) => ({ key: p, uri: urls[p], remove: () => setExisting((e) => e.filter((x) => x !== p)) })),
    ...fresh.map((img, i) => ({ key: img.uri, uri: img.uri, remove: () => setFresh((f) => f.filter((_, j) => j !== i)) })),
  ];

  return (
    <Screen>
      <Text style={type.display}>{id ? t.listings.edit : t.listings.add}</Text>

      <Text style={type.label}>{t.listings.type}</Text>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Chip label={t.listings.sale} selected={kind === 'satilik'} onPress={() => setKind('satilik')} />
        <Chip label={t.listings.rent} selected={kind === 'kiralik'} onPress={() => setKind('kiralik')} />
      </View>

      <Field label={t.listings.titleField} value={title} onChangeText={setTitle} autoCapitalize="sentences" />

      <Text style={type.label}>{t.listings.district}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
        {ANKARA_DISTRICTS.map((d) => (
          <Chip key={d} label={d} selected={district === d} onPress={() => setDistrict(district === d ? '' : d)} />
        ))}
      </ScrollView>
      <Field label={t.listings.neighborhood} value={neighborhood} onChangeText={setNeighborhood} autoCapitalize="words" />

      <Field label={t.listings.price} value={price} onChangeText={(v) => setPrice(v.replace(/[^\d.,]/g, ''))} keyboardType="decimal-pad" />

      <Text style={type.label}>{t.listings.rooms}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
        {ROOM_OPTIONS.map((r) => (
          <Chip key={r} label={r} selected={rooms === r} onPress={() => setRooms(rooms === r ? '' : r)} />
        ))}
      </ScrollView>

      <Field label={t.listings.area} value={area} onChangeText={(v) => setArea(v.replace(/[^\d.,]/g, ''))} keyboardType="decimal-pad" />
      <Field
        label={t.listings.description}
        value={description}
        onChangeText={setDescription}
        autoCapitalize="sentences"
        multiline
        style={{ minHeight: 110, textAlignVertical: 'top', paddingTop: space.sm }}
      />

      {firms.length > 0 ? (
        <>
          <Text style={type.label}>{t.listings.firm}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
            {firms.map((f) => (
              <Chip key={f.id} label={f.name} selected={firmId === f.id} onPress={() => setFirmId(firmId === f.id ? null : f.id)} />
            ))}
          </ScrollView>
        </>
      ) : null}

      <Text style={type.label}>{t.listings.photos}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {thumbs.map((th) => (
          <View key={th.key}>
            <Image source={{ uri: th.uri }} contentFit="cover" style={{ width: 88, height: 88, borderRadius: radius.md, backgroundColor: colors.border }} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.common.delete}
              onPress={th.remove}
              hitSlop={8}
              style={{ position: 'absolute', top: 4, right: 4, backgroundColor: colors.ink, borderRadius: radius.pill, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>×</Text>
            </Pressable>
          </View>
        ))}
      </View>
      <Button title={t.listings.addPhotos} variant="secondary" onPress={addPhotos} />

      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button title={t.common.save} onPress={submit} disabled={busy} />
    </Screen>
  );
}
