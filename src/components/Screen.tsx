import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, space } from '@/theme';

export function Screen({ children, centered }: { children: ReactNode; centered?: boolean }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: space.lg,
          gap: space.md,
          flexGrow: 1,
          justifyContent: centered ? 'center' : 'flex-start',
        }}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
