import { Text, View } from 'react-native';

import { t } from '@/i18n/tr';

export default function Home() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>{t.tabs.home}</Text>
    </View>
  );
}
