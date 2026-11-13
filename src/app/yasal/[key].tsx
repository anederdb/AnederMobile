import { Ionicons } from '@expo/vector-icons';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { LEGAL_DRAFT_NOTICE, LEGAL_KEYS, LEGAL_PAGES, type LegalKey } from '@/i18n/legalTexts';
import { colors, radius, space, type } from '@/theme';

export default function LegalPage() {
  const { key } = useLocalSearchParams<{ key: string }>();
  if (!LEGAL_KEYS.includes(key as LegalKey)) return <Redirect href="/" />;
  const page = LEGAL_PAGES[key as LegalKey];
  return (
    <Screen>
      <Text style={type.display}>{page.title}</Text>
      <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', backgroundColor: colors.primaryTint, borderRadius: radius.md, padding: space.sm + 4 }}>
        <Ionicons name="information-circle" size={20} color={colors.primary} />
        <Text style={[type.caption, { flex: 1, color: colors.primary }]}>{LEGAL_DRAFT_NOTICE}</Text>
      </View>
      {page.sections.map((s) => (
        <View key={s.heading} style={{ gap: space.xs }}>
          <Text accessibilityRole="header" style={type.heading}>
            {s.heading}
          </Text>
          <Text style={type.body}>{s.body}</Text>
        </View>
      ))}
    </Screen>
  );
}
