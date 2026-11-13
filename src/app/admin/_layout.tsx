import { Stack } from 'expo-router';

import { t } from '@/i18n/tr';
import { colors } from '@/theme';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.ink },
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        headerBackButtonDisplayMode: 'minimal',
      }}>
      <Stack.Screen name="events" options={{ title: t.admin.events }} />
      <Stack.Screen name="announcements" options={{ title: t.admin.announcements }} />
      <Stack.Screen name="offers" options={{ title: t.admin.offers }} />
      <Stack.Screen name="news" options={{ title: t.news.manage }} />
      <Stack.Screen name="pages" options={{ title: t.corporate.managePages }} />
      <Stack.Screen name="trainings" options={{ title: t.corporate.manageTrainings }} />
      <Stack.Screen name="attendance" options={{ title: t.qr.attendance }} />
      <Stack.Screen name="rsvps" options={{ title: t.rsvp.list }} />
      <Stack.Screen name="members" options={{ title: t.admin.members }} />
      <Stack.Screen name="send-push" options={{ title: t.admin.sendPush }} />
    </Stack>
  );
}
