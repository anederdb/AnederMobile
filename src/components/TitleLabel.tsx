import { Text, View } from 'react-native';

import { colors, radius, space, type } from '@/theme';

/** Small pill shown under a member's name; renders nothing without a title. */
export function TitleLabel({ title }: { title: string | null | undefined }) {
  if (!title) return null;
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: colors.background,
        borderColor: colors.primary,
        borderWidth: 1,
        borderRadius: radius.pill,
        paddingHorizontal: space.sm,
        paddingVertical: 2,
      }}>
      <Text style={[type.label, { color: colors.primary }]}>{title}</Text>
    </View>
  );
}
