import { useMemo, useState } from 'react';
import { Text } from 'react-native';

import { Logo } from '@/components/Logo';
import { Screen } from '@/components/Screen';
import { Button, ErrorText, Field } from '@/components/ui';
import { t } from '@/i18n/tr';
import { useSession } from '@/lib/session';
import { singleFlight } from '@/lib/singleFlight';
import { supabase } from '@/lib/supabase';
import { type } from '@/theme';

export default function ResetPassword() {
  const { finishRecovery } = useSession();
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState('');

  const save = useMemo(
    () =>
      singleFlight(async () => {
        setError('');
        if (password.length < 6) return setError(t.auth.passwordShort);
        if (password !== again) return setError(t.auth.passwordMismatch);
        const { error: err } = await supabase.auth.updateUser({ password });
        if (err) return setError(t.auth.resetFailed);
        finishRecovery();
      }),
    [password, again, finishRecovery],
  );

  return (
    <Screen centered>
      <Logo size={96} />
      <Text style={[type.display, { textAlign: 'center' }]}>{t.auth.resetTitle}</Text>
      <Field label={t.auth.newPassword} value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
      <Field label={t.auth.newPasswordAgain} value={again} onChangeText={setAgain} secureTextEntry autoComplete="new-password" />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button title={t.auth.savePassword} onPress={() => save()} />
    </Screen>
  );
}
