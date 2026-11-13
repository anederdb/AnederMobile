import { Stack } from 'expo-router';

import { t } from '@/i18n/tr';
import { subScreenOptions } from '@/lib/stackOptions';

export default function Layout() {
  return (
    <Stack screenOptions={subScreenOptions('/')}>
      <Stack.Screen name="index" options={{ title: t.corporate.title }} />
      <Stack.Screen name="egitimler" options={{ title: t.corporate.trainings }} />
      <Stack.Screen name="[key]" options={{ title: t.corporate.title }} />
    </Stack>
  );
}
