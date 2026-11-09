import { useRouter } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { t } from '@/i18n/tr';
import { colors, radius, space, type } from '@/theme';

const PAGES = [
  { key: 'baskan-mesaji', label: t.about.president.title },
  { key: 'hakkimizda', label: t.about.association.title },
] as const;

export default function About() {
  const router = useRouter();
  return (
    <Screen>
      <Text style={type.display}>{t.about.entry}</Text>
      {PAGES.map((p) => (
        <Pressable
          key={p.key}
          accessibilityRole="link"
          onPress={() => router.push({ pathname: '/uyeler/hakkimizda/[key]', params: { key: p.key } })}
          style={({ pressed }) => ({
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            padding: space.md,
            minHeight: 56,
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
          })}>
          <Text style={type.heading}>{p.label}</Text>
        </Pressable>
      ))}
    </Screen>
  );
}
