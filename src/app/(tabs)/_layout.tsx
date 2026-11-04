import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { t } from '@/i18n/tr';
import { colors } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const screens: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: t.tabs.home, icon: 'home-outline' },
  { name: 'etkinlikler', title: t.tabs.events, icon: 'calendar-outline' },
  { name: 'ilanlar', title: t.tabs.listings, icon: 'business-outline' },
  { name: 'uyeler', title: t.tabs.members, icon: 'people-outline' },
  { name: 'profil', title: t.tabs.profile, icon: 'person-outline' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          // web has no safe-area insets, so give the labels room; native sizes the bar itself
          ...Platform.select({ web: { height: 68, paddingTop: 6, paddingBottom: 10 }, default: {} }),
        },
      }}>
      {screens.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, size }) => <Ionicons name={icon} color={color as string} size={size} />,
          }}
        />
      ))}
    </Tabs>
  );
}
