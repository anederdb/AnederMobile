import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { colors, type } from '@/theme';

/** Round profile photo; falls back to the person's initial. */
export function Avatar({ url, name, size = 64 }: { url?: string | null; name?: string | null; size?: number }) {
  const box = { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surface, overflow: 'hidden' as const };
  if (url) return <Image source={{ uri: url }} contentFit="cover" style={box} accessibilityLabel={name ?? undefined} />;
  return (
    <View style={[box, { alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={[type.title, { color: colors.primary }]}>{(name ?? '?').trim().charAt(0).toUpperCase()}</Text>
    </View>
  );
}
