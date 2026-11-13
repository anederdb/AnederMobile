import { Stack } from 'expo-router';

import { t } from '@/i18n/tr';
import { subScreenOptions } from '@/lib/stackOptions';

// Legal pages are readable signed in or out (signup links here), so back falls back to the app root.
export default function Layout() {
  return (
    <Stack screenOptions={subScreenOptions('/')}>
      <Stack.Screen name="[key]" options={{ title: t.legal.title }} />
    </Stack>
  );
}
