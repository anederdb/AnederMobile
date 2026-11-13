import { useRouter } from 'expo-router';
import { Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { ListGroup, ListRow } from '@/components/ui';
import { t } from '@/i18n/tr';
import { SITE_PAGES } from '@/lib/sitePages';
import { type } from '@/theme';

export default function CorporateHub() {
  const router = useRouter();
  return (
    <Screen>
      <Text style={type.display}>{t.corporate.title}</Text>
      <ListGroup>
        {SITE_PAGES.map((p) => (
          <ListRow key={p.key} icon={p.icon} title={p.title} onPress={() => router.push({ pathname: '/kurumsal/[key]', params: { key: p.key } })} />
        ))}
        <ListRow icon="play-circle-outline" title={t.corporate.trainings} onPress={() => router.push('/kurumsal/egitimler')} />
      </ListGroup>
    </Screen>
  );
}
