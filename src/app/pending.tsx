import { Text } from 'react-native';

import { Logo } from '@/components/Logo';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/ui';
import { t } from '@/i18n/tr';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { type } from '@/theme';

export default function Pending() {
  const { refreshProfile } = useSession();
  return (
    <Screen centered>
      <Logo size={112} />
      <Text style={[type.title, { textAlign: 'center' }]}>{t.pending.title}</Text>
      <Text style={[type.body, { textAlign: 'center' }]}>{t.pending.body}</Text>
      <Button title={t.pending.refresh} onPress={refreshProfile} />
      <Button title={t.auth.logout} variant="secondary" onPress={() => supabase.auth.signOut()} />
    </Screen>
  );
}
