import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Linking, Pressable, Text, View } from 'react-native';

import { Badge, Card } from '@/components/ui';
import { t } from '@/i18n/tr';
import type { Offer } from '@/lib/types';
import { colors, radius, space, type } from '@/theme';

export function OfferCard({ offer }: { offer: Offer }) {
  return (
    <Card style={{ padding: 0 }}>
      {offer.image_url ? (
        <Image
          source={{ uri: offer.image_url }}
          contentFit="cover"
          accessibilityLabel={offer.title}
          style={{ width: '100%', aspectRatio: 16 / 9, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, backgroundColor: colors.border }}
        />
      ) : null}
      <View style={{ padding: space.md, gap: space.sm }}>
        <Badge label={offer.sponsor} />
        <Text style={type.heading}>{offer.title}</Text>
        {offer.description ? <Text style={type.body}>{offer.description}</Text> : null}
        {offer.valid_until ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="calendar-outline" size={15} color={colors.muted} />
            <Text style={type.caption}>
              {t.offers.validUntil}: {offer.valid_until.split('-').reverse().join('.')}
            </Text>
          </View>
        ) : null}
        {offer.link ? (
          <Pressable
            accessibilityRole="link"
            onPress={() => Linking.openURL(offer.link!)}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>{t.offers.open}</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}
