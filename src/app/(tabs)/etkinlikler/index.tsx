import { Text, View } from 'react-native';

import { t } from '@/i18n/tr';

export default function Events() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>{t.tabs.events}</Text>
    </View>
  );
}
