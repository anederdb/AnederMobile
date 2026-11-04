import { Link } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { Logo } from '@/components/Logo';
import { Screen } from '@/components/Screen';
import { Button, ErrorText, Field } from '@/components/ui';
import { t } from '@/i18n/tr';
import { supabase } from '@/lib/supabase';
import { colors, space, type } from '@/theme';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    if (!fullName.trim() || !phone.trim() || !email.trim() || !password) return setError(t.auth.required);
    if (password.length < 6) return setError(t.auth.passwordShort);
    setBusy(true);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim(), phone: phone.trim() } },
    });
    setBusy(false);
    if (err) return setError(t.auth.registerFailed);
    // With email confirmation on, no session is returned until the link is opened.
    if (!data.session) setNotice(t.auth.checkEmail);
  }

  return (
    <Screen centered>
      <Logo size={96} />
      <Text style={[type.display, { textAlign: 'center', marginBottom: space.sm }]}>{t.auth.registerTitle}</Text>
      <Field label={t.auth.fullName} value={fullName} onChangeText={setFullName} autoCapitalize="words" autoComplete="name" />
      <Field label={t.auth.phone} value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
      <Field label={t.auth.email} value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
      <Field label={t.auth.password} value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
      {error ? <ErrorText>{error}</ErrorText> : null}
      {notice ? <Text accessibilityRole="alert" style={type.label}>{notice}</Text> : null}
      <Button title={t.auth.register} onPress={submit} disabled={busy} />
      <Link href="/login" style={{ textAlign: 'center', color: colors.primary, fontWeight: '600', paddingVertical: space.sm }}>
        {t.auth.toLogin}
      </Link>
    </Screen>
  );
}
