import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { colors, type } from '@/theme';

/** Round profile photo; falls back to the person's initial on a pale brand tint. */
export function Avatar({ url, name, size = 64 }: { url?: string | null; name?: string | null; size?: number }) {
  const box = { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primaryTint, overflow: 'hidden' as const };
  if (url) return <Image source={{ uri: url }} contentFit="cover" style={box} accessibilityLabel={name ?? undefined} />;
  const initial = (name ?? '').trim().charAt(0).toUpperCase();
  return (
    <View style={[box, { alignItems: 'center', justifyContent: 'center' }]}>
      {initial ? (
        <Text style={[type.title, { color: colors.primary, fontSize: Math.round(size * 0.4), lineHeight: Math.round(size * 0.5) }]}>{initial}</Text>
      ) : (
        <Ionicons name="person" size={Math.round(size * 0.5)} color={colors.primary} />
      )}
    </View>
  );
}
