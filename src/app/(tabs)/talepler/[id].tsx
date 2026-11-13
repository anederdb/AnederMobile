import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { ContactActions } from '@/components/ContactActions';
import { ListingCard } from '@/components/ListingCard';
import { Screen } from '@/components/Screen';
import { Badge, Button, Card, InfoRow, Skeleton } from '@/components/ui';
import { t } from '@/i18n/tr';
import { confirm } from '@/lib/confirm';
import { formatPriceRange } from '@/lib/listingFilters';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import type { Firm, Listing, Profile } from '@/lib/types';
import { card, colors, space, type } from '@/theme';

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useSession();
  const [listing, setListing] = useState<Listing | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [firm, setFirm] = useState<Firm | null>(null);
  const [similar, setSimilar] = useState<Listing[]>([]);
  const [matches, setMatches] = useState<Listing[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('listings').select('*').eq('id', id).maybeSingle();
      const l = data as Listing | null;
      setListing(l);
      if (!l) return;
      const [ownerRes, firmRes, similarRes, matchRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', l.owner_id).maybeSingle(),
        l.firm_id ? supabase.from('firms').select('*').eq('id', l.firm_id).maybeSingle() : Promise.resolve({ data: null }),
        supabase.rpc('similar_listings', { p_listing_id: l.id }),
        supabase.rpc('matching_listings', { p_listing_id: l.id }),
      ]);
      setOwner(ownerRes.data as Profile | null);
      setFirm(firmRes.data as Firm | null);
      const sim = (similarRes.data as Listing[] | null) ?? [];
      setSimilar(sim);
      // If the function is not available yet (migration not applied) this is simply empty, never a crash.
      setMatches((matchRes.data as Listing[] | null) ?? []);
    })();
  }, [id]);

  if (!listing) {
    return (
      <Screen>
        <Skeleton height={36} />
        <Skeleton height={56} />
        <Skeleton height={120} />
      </Screen>
    );
  }

  const canManage = profile?.id === listing.owner_id || profile?.role === 'admin';
  const place = [listing.neighborhood, listing.district].filter(Boolean).join(', ');
  const specs = [listing.rooms.join(', ') || null, listing.area_m2 ? `${listing.area_m2} ${t.listings.sqm}` : null].filter(Boolean).join(' · ');

  async function remove() {
    if (!(await confirm(t.listings.deleteConfirm, listing!.title))) return;
    await supabase.from('listings').delete().eq('id', listing!.id);
    router.replace('/talepler');
  }

  return (
    <Screen>
      <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
        <Badge label={listing.side === 'ver' ? t.listings.badgeVer : t.listings.badgeAl} tone={listing.side === 'ver' ? 'brand' : 'neutral'} />
        <Badge label={listing.type === 'satilik' ? t.listings.sale : t.listings.rent} tone={listing.type === 'satilik' ? 'success' : 'info'} />
      </View>
      <Text style={[type.display, { color: colors.primary }]}>{formatPriceRange(listing.min_price, listing.max_price) ?? '—'}</Text>
      <Text style={type.title}>{listing.title}</Text>
      {place || specs ? (
        <Card style={{ gap: space.md }}>
          {place ? <InfoRow icon="location-outline" text={place} /> : null}
          {specs ? <InfoRow icon="home-outline" text={specs} /> : null}
        </Card>
      ) : null}
      {listing.description ? <Text style={type.body}>{listing.description}</Text> : null}
      {listing.link ? (
        <Button
          title={t.listings.openLink}
          variant="secondary"
          icon={<Ionicons name="open-outline" size={20} color={colors.ink} />}
          onPress={() => Linking.openURL(listing.link!)}
        />
      ) : null}

      {owner ? (
        <View style={{ ...card, gap: space.sm }}>
          <Text style={type.label}>{t.listings.contact}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Avatar url={owner.avatar_url} name={owner.full_name} size={52} />
            <View style={{ flex: 1 }}>
              <Text style={type.heading}>{owner.full_name}</Text>
              {firm ? <Text style={type.caption}>{firm.name}</Text> : null}
            </View>
          </View>
          {owner.phone ? <ContactActions phone={owner.phone} /> : null}
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
            <Button title={t.common.edit} variant="secondary" onPress={() => router.push({ pathname: '/talepler/form', params: { id: listing.id } })} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title={t.common.delete} variant="danger" onPress={remove} />
          </View>
        </View>
      ) : null}

      <Text style={[type.title, { marginTop: space.sm }]}>{t.listings.matches}</Text>
      {matches.length === 0 ? <Text style={type.caption}>{t.listings.noMatches}</Text> : null}
      {matches.map((m) => (
        <ListingCard key={m.id} listing={m} />
      ))}

      {similar.length > 0 ? (
        <>
          <Text style={[type.title, { marginTop: space.sm }]}>{t.listings.similar}</Text>
          {similar.map((s) => (
            <ListingCard key={s.id} listing={s} />
          ))}
        </>
      ) : null}
    </Screen>
  );
}
