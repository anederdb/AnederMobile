import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { Pressable } from 'react-native';

import { t } from '@/i18n/tr';
import { colors } from '@/theme';

/**
 * Header back arrow that always works: it pops the stack when there is a screen underneath,
 * otherwise (the screen was opened from another tab) it goes to the tab's main screen.
 */
export function BackButton({ canGoBack, fallback }: { canGoBack?: boolean; fallback: Href }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.common.back}
      hitSlop={12}
      onPress={() => (canGoBack ? router.back() : router.replace(fallback))}
      style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="chevron-back" size={28} color={colors.primary} />
    </Pressable>
  );
}
