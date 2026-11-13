import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Button, Chip, ErrorText, Field } from '@/components/ui';
import { t } from '@/i18n/tr';
import { ANKARA_DISTRICTS, ROOM_OPTIONS } from '@/lib/districts';
import { parseLink } from '@/lib/links';
import { parsePriceInput } from '@/lib/listingFilters';
import { useSession } from '@/lib/session';
import { singleFlight } from '@/lib/singleFlight';
import { supabase } from '@/lib/supabase';
import type { Firm, Listing } from '@/lib/types';
import { space, type } from '@/theme';

export default function ListingForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { profile } = useSession();

  const [side, setSide] = useState<'al' | 'ver'>('al');
  const [kind, setKind] = useState<'satilik' | 'kiralik'>('satilik');
  const [title, setTitle] = useState('');
  const [district, setDistrict] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [rooms, setRooms] = useState<string[]>([]);
  const [link, setLink] = useState('');
  const [area, setArea] = useState('');
  const [description, setDescription] = useState('');
  const [firmId, setFirmId] = useState<string | null>(null);
  const [firms, setFirms] = useState<Firm[]>([]);
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
      .then(({ data }) => {
        const l = data as Listing | null;
        if (!l) return;
        setSide(l.side);
        setKind(l.type);
        setTitle(l.title);
        setDistrict(l.district ?? '');
        setNeighborhood(l.neighborhood ?? '');
        setMinPrice(l.min_price != null ? String(l.min_price) : '');
        setMaxPrice(l.max_price != null ? String(l.max_price) : '');
        setRooms(l.rooms);
        setLink(l.link ?? '');
        setArea(l.area_m2 != null ? String(l.area_m2) : '');
        setDescription(l.description ?? '');
        setFirmId(l.firm_id);
      });
  }, [id]);

  const allRooms = rooms.length === ROOM_OPTIONS.length;
  const toggleRoom = (r: string) => setRooms((cur) => (cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r]));

  const submit = useMemo(
    () =>
      singleFlight(async () => {
        setError('');
        if (!title.trim()) return setError(t.auth.required);
        const min = parsePriceInput(minPrice);
        const max = parsePriceInput(maxPrice);
        const areaNum = area.trim() ? Number(area.replace(',', '.')) : null;
        if ((minPrice.trim() && min === null) || (maxPrice.trim() && max === null) || (areaNum !== null && !Number.isFinite(areaNum))) {
          return setError(t.listings.invalidNumber);
        }
        if (min !== null && max !== null && min > max) return setError(t.listings.minGreaterThanMax);
        const parsedLink = parseLink(link);
        if (!parsedLink.ok) return setError(t.listings.invalidLink);
        setBusy(true);
        const row = {
          side,
          type: kind,
          title: title.trim(),
          district: district || null,
          neighborhood: neighborhood.trim() || null,
          min_price: min,
          max_price: max,
          rooms,
          link: parsedLink.url,
          area_m2: areaNum,
          description: description.trim() || null,
          firm_id: firmId,
        };
        const result = id
          ? await supabase.from('listings').update(row).eq('id', id).select('id').single()
          : await supabase.from('listings').insert({ ...row, owner_id: profile!.id }).select('id').single();
        setBusy(false);
        if (result.error) return setError(t.common.error);
        router.replace({ pathname: '/talepler/[id]', params: { id: result.data.id } });
      }),
    [title, minPrice, maxPrice, area, link, side, kind, district, neighborhood, rooms, description, firmId, id, profile, router],
  );

  return (
    <Screen>
      <Text style={type.display}>{id ? t.listings.edit : t.listings.add}</Text>

      <Text style={type.label}>{t.listings.kindQuestion}</Text>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Chip label={t.listings.sideAl} selected={side === 'al'} onPress={() => setSide('al')} />
        <Chip label={t.listings.sideVer} selected={side === 'ver'} onPress={() => setSide('ver')} />
      </View>

      <Text style={type.label}>{t.listings.type}</Text>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Chip label={t.listings.sale} selected={kind === 'satilik'} onPress={() => setKind('satilik')} />
        <Chip label={t.listings.rent} selected={kind === 'kiralik'} onPress={() => setKind('kiralik')} />
      </View>

      <Field label={t.listings.titleField} value={title} onChangeText={setTitle} autoCapitalize="sentences" />

      <Text style={type.label}>{t.listings.district}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: space.sm }}>
        {ANKARA_DISTRICTS.map((d) => (
          <Chip key={d} label={d} selected={district === d} onPress={() => setDistrict(district === d ? '' : d)} />
        ))}
      </ScrollView>
      <Field label={t.listings.neighborhood} value={neighborhood} onChangeText={setNeighborhood} autoCapitalize="words" />

      <Text style={type.label}>{t.listings.priceRange}</Text>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <Field label={t.listings.minPrice} value={minPrice} onChangeText={(v) => setMinPrice(v.replace(/[^\d.,]/g, ''))} keyboardType="decimal-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={t.listings.maxPrice} value={maxPrice} onChangeText={(v) => setMaxPrice(v.replace(/[^\d.,]/g, ''))} keyboardType="decimal-pad" />
        </View>
      </View>

      <Text style={type.label}>{t.listings.rooms}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: space.sm }}>
        <Chip label={t.listings.selectAll} selected={allRooms} onPress={() => setRooms(allRooms ? [] : [...ROOM_OPTIONS])} />
        {ROOM_OPTIONS.map((r) => (
          <Chip key={r} label={r} selected={rooms.includes(r)} onPress={() => toggleRoom(r)} />
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

      <Field label={t.listings.link} value={link} onChangeText={setLink} keyboardType="url" autoCapitalize="none" autoCorrect={false} />

      {firms.length > 0 ? (
        <>
          <Text style={type.label}>{t.listings.firm}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: space.sm }}>
            {firms.map((f) => (
              <Chip key={f.id} label={f.name} selected={firmId === f.id} onPress={() => setFirmId(firmId === f.id ? null : f.id)} />
            ))}
          </ScrollView>
        </>
      ) : null}

      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button title={t.common.save} onPress={() => submit()} loading={busy} />
    </Screen>
  );
}
