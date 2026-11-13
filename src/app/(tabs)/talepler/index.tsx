import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { ListingCard } from '@/components/ListingCard';
import { Screen } from '@/components/Screen';
import { Button, Chip, EmptyState, Field, Skeleton } from '@/components/ui';
import { t } from '@/i18n/tr';
import { ANKARA_DISTRICTS, ROOM_OPTIONS } from '@/lib/districts';
import { applyListingFilters, type ListingFilters } from '@/lib/listingFilters';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import type { Listing } from '@/lib/types';
import { colors, space, type } from '@/theme';

export default function Listings() {
  const router = useRouter();
  const [filters, setFilters] = useState<ListingFilters>({});
  const [minText, setMinText] = useState('');
  const [maxText, setMaxText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [items, setItems] = useState<Listing[] | null>(null);
  const [recommended, setRecommended] = useState(false);
  const [hasOwnPosts, setHasOwnPosts] = useState(true);
  const { profile } = useSession();

  const load = useCallback(
    async (f: ListingFilters, rec: boolean) => {
      if (rec) {
        // my_recommendations() already returns the best matches first, so no extra ordering here.
        const { data } = await applyListingFilters(supabase.rpc('my_recommendations', { p_limit: 50 }), f);
        const rows = (data as Listing[]) ?? [];
        setItems(rows);
        if (rows.length === 0 && profile) {
          const { count } = await supabase.from('listings').select('id', { count: 'exact', head: true }).eq('owner_id', profile.id);
          setHasOwnPosts((count ?? 0) > 0);
        }
        return;
      }
      const { data } = await applyListingFilters(supabase.from('listings').select('*'), f).order('created_at', {
        ascending: false,
      });
      setItems((data as Listing[]) ?? []);
    },
    [profile],
  );

  useFocusEffect(
    useCallback(() => {
      load(filters, recommended);
    }, [load, filters, recommended]),
  );

  function update(patch: Partial<ListingFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  function setPrice(kind: 'min' | 'max', text: string) {
    const digits = text.replace(/\D/g, '');
    (kind === 'min' ? setMinText : setMaxText)(digits);
    update(kind === 'min' ? { minPrice: digits ? Number(digits) : undefined } : { maxPrice: digits ? Number(digits) : undefined });
  }

  function toggleRoom(room: string) {
    const current = filters.rooms ?? [];
    const next = current.includes(room) ? current.filter((r) => r !== room) : [...current, room];
    update({ rooms: next.length ? next : undefined });
  }

  function clear() {
    setFilters({});
    setRecommended(false);
    setMinText('');
    setMaxText('');
  }

  const active = Object.values(filters).filter((v) => v !== undefined && v !== '').length + (recommended ? 1 : 0);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={type.display}>{t.listings.title}</Text>
      </View>
      <Button title={t.listings.add} icon={<Ionicons name="add" size={22} color={colors.onPrimary} />} onPress={() => router.push('/talepler/form')} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: space.sm }}>
        <Chip label={t.listings.all} selected={!filters.side && !recommended} onPress={() => { update({ side: undefined }); setRecommended(false); }} />
        <Chip label={t.listings.filterAl} selected={filters.side === 'al'} onPress={() => update({ side: filters.side === 'al' ? undefined : 'al' })} />
        <Chip label={t.listings.filterVer} selected={filters.side === 'ver'} onPress={() => update({ side: filters.side === 'ver' ? undefined : 'ver' })} />
        <Chip label={t.listings.recommended} selected={recommended} onPress={() => setRecommended((r) => !r)} />
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
        <Chip label={t.listings.all} selected={!filters.type} onPress={() => update({ type: undefined })} />
        <Chip label={t.listings.sale} selected={filters.type === 'satilik'} onPress={() => update({ type: 'satilik' })} />
        <Chip label={t.listings.rent} selected={filters.type === 'kiralik'} onPress={() => update({ type: 'kiralik' })} />
        <View style={{ flex: 1 }} />
        <Chip label={`${t.listings.filters}${active ? ` (${active})` : ''}`} selected={showFilters} onPress={() => setShowFilters((s) => !s)} />
      </View>

      {showFilters ? (
        <View style={{ gap: space.md }}>
          <Text style={type.label}>{t.listings.district}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: space.sm }}>
            {ANKARA_DISTRICTS.map((d) => (
              <Chip key={d} label={d} selected={filters.district === d} onPress={() => update({ district: filters.district === d ? undefined : d })} />
            ))}
          </ScrollView>
          <Field label={t.listings.neighborhood} value={filters.neighborhood ?? ''} onChangeText={(v) => update({ neighborhood: v })} autoCapitalize="words" />
          <Text style={type.label}>{t.listings.rooms}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: space.sm }}>
            {ROOM_OPTIONS.map((r) => (
              <Chip key={r} label={r} selected={!!filters.rooms?.includes(r)} onPress={() => toggleRoom(r)} />
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <View style={{ flex: 1 }}>
              <Field label={t.listings.minPrice} value={minText} onChangeText={(v) => setPrice('min', v)} keyboardType="number-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label={t.listings.maxPrice} value={maxText} onChangeText={(v) => setPrice('max', v)} keyboardType="number-pad" />
            </View>
          </View>
          {active ? <Button title={t.listings.clear} variant="secondary" onPress={clear} /> : null}
        </View>
      ) : null}

      {items === null ? (
        <>
          <Skeleton height={120} />
          <Skeleton height={120} />
        </>
      ) : null}
      {items && items.length === 0 && !recommended ? <EmptyState icon="business-outline" title={t.listings.empty} /> : null}
      {items && items.length === 0 && recommended ? (
        <EmptyState icon="sparkles-outline" title={hasOwnPosts ? t.listings.noRecommendations : t.listings.noPostsHint} />
      ) : null}
      {items?.map((l) => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </Screen>
  );
}
