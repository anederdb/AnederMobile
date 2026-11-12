import { Stack } from 'expo-router';

import { t } from '@/i18n/tr';
import { subScreenOptions } from '@/lib/stackOptions';

export const unstable_settings = { initialRouteName: 'index' };

export default function Layout() {
  return (
    <Stack screenOptions={subScreenOptions('/etkinlikler')}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: t.events.title }} />
    </Stack>
  );
}
