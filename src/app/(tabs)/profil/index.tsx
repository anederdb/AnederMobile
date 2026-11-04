import { Text, View } from 'react-native';

import { t } from '@/i18n/tr';

export default function Profile() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>{t.tabs.profile}</Text>
    </View>
  );
}
