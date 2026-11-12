import type { Href } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { colors } from '@/theme';

/**
 * Header with a back button for the screens inside a tab (the tab's own index screen hides it).
 * `fallback` is where back goes when the screen was opened from another tab and the stack has nothing underneath.
 */
export const subScreenOptions = (fallback: Href) =>
  ({
    headerShown: true,
    headerTintColor: colors.primary,
    headerTitleStyle: { color: colors.ink },
    headerStyle: { backgroundColor: colors.background },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: colors.background },
    headerLeft: ({ canGoBack }: { canGoBack?: boolean }) => <BackButton canGoBack={canGoBack} fallback={fallback} />,
  }) as const;
