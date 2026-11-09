import { Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { t } from '@/i18n/tr';
import { type } from '@/theme';

export default function Privacy() {
  return (
    <Screen>
      <Text style={type.display}>{t.legal.privacyTitle}</Text>
      <Text style={type.body}>{t.legal.privacyBody}</Text>
    </Screen>
  );
}
