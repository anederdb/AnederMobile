import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { t } from '@/i18n/tr';
import { colors } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// Outline when idle, filled when selected (not color alone).
const screens: { name: string; title: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'index', title: t.tabs.home, icon: 'home-outline', iconActive: 'home' },
  { name: 'etkinlikler', title: t.tabs.events, icon: 'calendar-outline', iconActive: 'calendar' },
  { name: 'talepler', title: t.tabs.listings, icon: 'business-outline', iconActive: 'business' },
  { name: 'uyeler', title: t.tabs.members, icon: 'people-outline', iconActive: 'people' },
  { name: 'profil', title: t.tabs.profile, icon: 'person-outline', iconActive: 'person' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        popToTopOnBlur: true, // leaving a tab resets its stack, so tapping it again shows its main screen
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          // web has no safe-area insets, so give the labels room; native sizes the bar itself
          ...Platform.select({ web: { height: 76, paddingTop: 8, paddingBottom: 14 }, default: {} }),
        },
      }}>
      {screens.map(({ name, title, icon, iconActive }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? iconActive : icon} color={color as string} size={size} />,
          }}
        />
      ))}
    </Tabs>
  );
}
