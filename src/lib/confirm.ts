import { Alert, Platform } from 'react-native';

import { t } from '@/i18n/tr';

// Alert.alert with buttons does nothing on web, so use window.confirm there.
export function confirm(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: t.common.cancel, style: 'cancel', onPress: () => resolve(false) },
      { text: t.common.delete, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
