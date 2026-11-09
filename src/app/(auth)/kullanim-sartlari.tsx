import { Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { t } from '@/i18n/tr';
import { type } from '@/theme';

export default function Terms() {
  return (
    <Screen>
      <Text style={type.display}>{t.legal.termsTitle}</Text>
      <Text style={type.body}>{t.legal.termsBody}</Text>
    </Screen>
  );
}
