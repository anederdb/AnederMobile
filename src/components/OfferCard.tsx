import { Linking, Text, View } from 'react-native';

import { t } from '@/i18n/tr';
import type { Offer } from '@/lib/types';
import { colors, radius, space, type } from '@/theme';

export function OfferCard({ offer }: { offer: Offer }) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: space.md,
        gap: space.xs,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
      }}>
      <Text style={[type.label, { color: colors.primary }]}>{offer.sponsor}</Text>
      <Text style={type.heading}>{offer.title}</Text>
      {offer.description ? <Text style={type.body}>{offer.description}</Text> : null}
      {offer.valid_until ? (
        <Text style={type.caption}>
          {t.offers.validUntil}: {offer.valid_until.split('-').reverse().join('.')}
        </Text>
      ) : null}
      {offer.link ? (
        <Text
          accessibilityRole="link"
          style={{ color: colors.primary, fontWeight: '600', paddingVertical: space.xs }}
          onPress={() => Linking.openURL(offer.link!)}>
          {t.offers.open}
        </Text>
      ) : null}
    </View>
  );
}
