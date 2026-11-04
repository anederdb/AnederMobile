import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { t } from '@/i18n/tr';

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
    <Tabs screenOptions={{ headerShown: false }}>
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
