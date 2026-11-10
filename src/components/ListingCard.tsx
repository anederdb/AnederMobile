import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Badge, Card } from '@/components/ui';
import { t } from '@/i18n/tr';
import { formatPriceRange } from '@/lib/listingFilters';
import type { Listing } from '@/lib/types';
import { colors, space, type } from '@/theme';

function Meta({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Ionicons name={icon} size={15} color={colors.muted} />
      <Text style={[type.caption, { flex: 1 }]}>{text}</Text>
    </View>
  );
}

export function ListingCard({ listing }: { listing: Listing }) {
  const router = useRouter();
  const place = [listing.neighborhood, listing.district].filter(Boolean).join(', ');
  const rooms = listing.rooms.join(', ');
  const area = listing.area_m2 ? `${listing.area_m2} ${t.listings.sqm}` : '';
  const sale = listing.type === 'satilik';
  return (
    <Card onPress={() => router.push({ pathname: '/talepler/[id]', params: { id: listing.id } })} style={{ gap: space.sm }}>
      <Badge label={sale ? t.listings.sale : t.listings.rent} tone={sale ? 'success' : 'info'} />
      <Text style={[type.title, { color: colors.primary }]}>{formatPriceRange(listing.min_price, listing.max_price) ?? '—'}</Text>
      <Text style={type.heading}>{listing.title}</Text>
      <View style={{ gap: 4 }}>
        {place ? <Meta icon="location-outline" text={place} /> : null}
        {rooms ? <Meta icon="bed-outline" text={rooms} /> : null}
        {area ? <Meta icon="resize-outline" text={area} /> : null}
      </View>
    </Card>
  );
}
