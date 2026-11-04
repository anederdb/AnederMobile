import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';

import { ListingCard } from '@/components/ListingCard';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/ui';
import { t } from '@/i18n/tr';
import { confirm } from '@/lib/confirm';
import { formatPrice } from '@/lib/listingFilters';
import { removeListingPhotos, signedUrls } from '@/lib/photos';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import type { Firm, Listing, Profile } from '@/lib/types';
import { colors, radius, space, type } from '@/theme';

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useSession();
  const [listing, setListing] = useState<Listing | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [firm, setFirm] = useState<Firm | null>(null);
  const [similar, setSimilar] = useState<Listing[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('listings').select('*').eq('id', id).maybeSingle();
      const l = data as Listing | null;
      setListing(l);
      if (!l) return;
      const [ownerRes, firmRes, similarRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', l.owner_id).maybeSingle(),
        l.firm_id ? supabase.from('firms').select('*').eq('id', l.firm_id).maybeSingle() : Promise.resolve({ data: null }),
        supabase.rpc('similar_listings', { p_listing_id: l.id }),
      ]);
      setOwner(ownerRes.data as Profile | null);
      setFirm(firmRes.data as Firm | null);
      const sim = (similarRes.data as Listing[] | null) ?? [];
      setSimilar(sim);
      setUrls(await signedUrls([...l.photos, ...sim.map((s) => s.photos[0]).filter(Boolean)]));
    })();
  }, [id]);

  if (!listing) {
    return (
      <Screen>
        <Text style={type.caption}>{t.common.loading}</Text>
      </Screen>
    );
  }

  const canManage = profile?.id === listing.owner_id || profile?.role === 'admin';
  const place = [listing.neighborhood, listing.district].filter(Boolean).join(', ');
  const specs = [listing.rooms, listing.area_m2 ? `${listing.area_m2} ${t.listings.sqm}` : null].filter(Boolean).join(' · ');

  async function remove() {
    if (!(await confirm(t.listings.deleteConfirm, listing!.title))) return;
    await supabase.from('listings').delete().eq('id', listing!.id);
    await removeListingPhotos(listing!.photos);
    router.replace('/ilanlar');
  }

  return (
    <Screen>
      {listing.photos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          {listing.photos.map((p) => (
            <Image
              key={p}
              source={{ uri: urls[p] }}
              accessibilityLabel={listing.title}
              contentFit="cover"
              style={{ width: 300, aspectRatio: 4 / 3, borderRadius: radius.lg, backgroundColor: colors.border }}
            />
          ))}
        </ScrollView>
      ) : null}

      <Text style={[type.display, { color: colors.primary }]}>{listing.price != null ? formatPrice(listing.price) : '—'}</Text>
      <Text style={type.title}>{listing.title}</Text>
      <Text style={type.label}>{listing.type === 'satilik' ? t.listings.sale : t.listings.rent}</Text>
      {place ? <Text style={type.body}>{place}</Text> : null}
      {specs ? <Text style={type.body}>{specs}</Text> : null}
      {listing.description ? <Text style={type.body}>{listing.description}</Text> : null}

      {owner ? (
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.md, gap: space.sm }}>
          <Text style={type.label}>{t.listings.contact}</Text>
          <Text style={type.heading}>{owner.full_name}</Text>
          {firm ? <Text style={type.caption}>{firm.name}</Text> : null}
          {owner.phone ? <Button title={`${t.listings.call}: ${owner.phone}`} onPress={() => Linking.openURL(`tel:${owner.phone}`)} /> : null}
          {firm?.sahibinden_url ? (
            <Text
              accessibilityRole="link"
              style={{ color: colors.primary, fontWeight: '600', paddingVertical: space.xs }}
              onPress={() => Linking.openURL(firm.sahibinden_url!)}>
              {t.firms.open}
            </Text>
          ) : null}
        </View>
      ) : null}

      {canManage ? (
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <View style={{ flex: 1 }}>
            <Button title={t.common.edit} variant="secondary" onPress={() => router.push({ pathname: '/ilanlar/form', params: { id: listing.id } })} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title={t.common.delete} variant="danger" onPress={remove} />
          </View>
        </View>
      ) : null}

      {similar.length > 0 ? (
        <>
          <Text style={[type.title, { marginTop: space.sm }]}>{t.listings.similar}</Text>
          {similar.map((s) => (
            <ListingCard key={s.id} listing={s} photoUrl={s.photos[0] ? urls[s.photos[0]] : undefined} />
          ))}
        </>
      ) : null}
    </Screen>
  );
}
