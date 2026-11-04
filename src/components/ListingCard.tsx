import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { t } from '@/i18n/tr';
import { formatPrice } from '@/lib/listingFilters';
import type { Listing } from '@/lib/types';
import { colors, radius, space, type } from '@/theme';

export function ListingCard({ listing, photoUrl }: { listing: Listing; photoUrl?: string }) {
  const router = useRouter();
  const place = [listing.neighborhood, listing.district].filter(Boolean).join(', ');
  const specs = [listing.rooms, listing.area_m2 ? `${listing.area_m2} ${t.listings.sqm}` : null].filter(Boolean).join(' · ');
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push({ pathname: '/ilanlar/[id]', params: { id: listing.id } })}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: space.md,
        gap: space.xs,
        opacity: pressed ? 0.85 : 1,
      })}>
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          accessibilityLabel={listing.title}
          contentFit="cover"
          style={{ aspectRatio: 16 / 9, borderRadius: radius.md, marginBottom: space.xs, backgroundColor: colors.border }}
        />
      ) : null}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[type.title, { color: colors.primary }]}>{listing.price != null ? formatPrice(listing.price) : '—'}</Text>
        <Text style={type.label}>{listing.type === 'satilik' ? t.listings.sale : t.listings.rent}</Text>
      </View>
      <Text style={type.heading}>{listing.title}</Text>
      {place ? <Text style={type.caption}>{place}</Text> : null}
      {specs ? <Text style={type.caption}>{specs}</Text> : null}
    </Pressable>
  );
}
