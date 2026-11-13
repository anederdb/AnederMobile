import { Stack } from 'expo-router';

import { t } from '@/i18n/tr';
import { subScreenOptions } from '@/lib/stackOptions';

export default function Layout() {
  return (
    <Stack screenOptions={subScreenOptions('/')}>
      <Stack.Screen name="index" options={{ title: t.news.title }} />
      <Stack.Screen name="[id]" options={{ title: t.news.title }} />
    </Stack>
  );
}
