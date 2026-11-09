import * as Linking from 'expo-linking';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text } from 'react-native';

import { Logo } from '@/components/Logo';
import { Screen } from '@/components/Screen';
import { Button, ErrorText, Field } from '@/components/ui';
import { t } from '@/i18n/tr';
import { singleFlight } from '@/lib/singleFlight';
import { supabase } from '@/lib/supabase';
import { colors, space, type } from '@/theme';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const send = useMemo(
    () =>
      singleFlight(async () => {
        setError('');
        setNotice('');
        if (!email.trim()) return setError(t.auth.required);
        const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: Linking.createURL('reset') });
        // Same message whether or not the address exists, so the form cannot be used to probe for members.
        if (err && err.status !== 400) return setError(t.common.error);
        setNotice(t.auth.resetSent);
      }),
    [email],
  );

  return (
    <Screen centered>
      <Logo size={96} />
      <Text style={[type.display, { textAlign: 'center' }]}>{t.auth.forgotTitle}</Text>
      <Text style={[type.caption, { textAlign: 'center' }]}>{t.auth.forgotHelp}</Text>
      <Field label={t.auth.email} value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
      {error ? <ErrorText>{error}</ErrorText> : null}
      {notice ? <Text accessibilityRole="alert" style={type.label}>{notice}</Text> : null}
      <Button title={t.auth.sendReset} onPress={() => send()} />
      <Link href="/login" style={{ textAlign: 'center', color: colors.primary, fontWeight: '600', paddingVertical: space.sm }}>
        {t.auth.toLogin}
      </Link>
    </Screen>
  );
}
