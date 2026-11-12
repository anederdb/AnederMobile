import { Stack } from 'expo-router';

import { t } from '@/i18n/tr';
import { subScreenOptions } from '@/lib/stackOptions';

// Always keep the profile list underneath, so opening /profil/qr from another tab still has a way back.
export const unstable_settings = { initialRouteName: 'index' };

export default function Layout() {
  return (
    <Stack screenOptions={subScreenOptions('/profil')}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="edit" options={{ title: t.profile.edit }} />
      <Stack.Screen name="qr" options={{ title: t.qr.myTitle }} />
      <Stack.Screen name="scan" options={{ title: t.qr.scanTitle }} />
      <Stack.Screen name="firms" options={{ title: t.firms.title }} />
    </Stack>
  );
}
