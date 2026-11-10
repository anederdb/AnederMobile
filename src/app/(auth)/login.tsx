import { Link } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { Logo } from '@/components/Logo';
import { Screen } from '@/components/Screen';
import { Button, ErrorText, Field } from '@/components/ui';
import { t } from '@/i18n/tr';
import { supabase } from '@/lib/supabase';
import { colors, space, type } from '@/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    if (!email.trim() || !password) return setError(t.auth.required);
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) setError(t.auth.invalid);
  }

  return (
    <Screen centered>
      <Logo size={132} />
      <Text style={[type.display, { textAlign: 'center' }]}>{t.auth.loginTitle}</Text>
      <Text style={[type.caption, { textAlign: 'center', marginBottom: space.sm }]}>{t.auth.tagline}</Text>
      <Field label={t.auth.email} value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
      <Field label={t.auth.password} value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button title={t.auth.login} onPress={submit} loading={busy} />
      <Link href="/forgot" style={{ textAlign: 'center', color: colors.primary, fontWeight: '600', paddingVertical: space.sm }}>
        {t.auth.forgot}
      </Link>
      <Link href="/register" style={{ textAlign: 'center', color: colors.primary, fontWeight: '600', paddingVertical: space.sm }}>
        {t.auth.toRegister}
      </Link>
    </Screen>
  );
}
