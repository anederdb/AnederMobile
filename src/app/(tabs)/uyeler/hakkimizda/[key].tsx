import { Redirect, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { t } from '@/i18n/tr';
import { type } from '@/theme';

const CONTENT = {
  'baskan-mesaji': t.about.president,
  hakkimizda: t.about.association,
} as const;

export default function AboutPage() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const page = CONTENT[key as keyof typeof CONTENT];
  if (!page) return <Redirect href="/uyeler/hakkimizda" />;
  return (
    <Screen>
      <Text style={type.display}>{page.title}</Text>
      <Text style={type.body}>{page.body}</Text>
    </Screen>
  );
}
