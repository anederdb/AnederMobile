import { Alert, Platform } from 'react-native';

import { t } from '@/i18n/tr';

// Alert.alert with buttons does nothing on web, so use window.confirm there.
// Without `actionLabel` the action is a destructive "Sil"; pass one (e.g. "Gönder") for non-destructive actions.
export function confirm(title: string, message: string, actionLabel?: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: t.common.cancel, style: 'cancel', onPress: () => resolve(false) },
      { text: actionLabel ?? t.common.delete, style: actionLabel ? 'default' : 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
