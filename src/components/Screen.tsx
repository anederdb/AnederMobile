import type { ReactNode, Ref } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, space } from '@/theme';

export function Screen({ children, centered, scrollRef }: { children: ReactNode; centered?: boolean; scrollRef?: Ref<ScrollViewInstance> }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{
            padding: space.lg,
            paddingBottom: space.lg * 4,
            gap: space.md,
            flexGrow: 1,
            justifyContent: centered ? 'center' : 'flex-start',
          }}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
