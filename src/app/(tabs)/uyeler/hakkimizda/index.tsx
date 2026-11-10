import { useRouter } from 'expo-router';
import { Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { ListGroup, ListRow, type IconName } from '@/components/ui';
import { t } from '@/i18n/tr';
import { type } from '@/theme';

const PAGES: { key: string; label: string; icon: IconName }[] = [
  { key: 'baskan-mesaji', label: t.about.president.title, icon: 'chatbubble-ellipses-outline' },
  { key: 'hakkimizda', label: t.about.association.title, icon: 'information-circle-outline' },
];

export default function About() {
  const router = useRouter();
  return (
    <Screen>
      <Text style={type.display}>{t.about.entry}</Text>
      <ListGroup>
        {PAGES.map((p) => (
          <ListRow
            key={p.key}
            icon={p.icon}
            title={p.label}
            onPress={() => router.push({ pathname: '/uyeler/hakkimizda/[key]', params: { key: p.key } })}
          />
        ))}
      </ListGroup>
    </Screen>
  );
}
