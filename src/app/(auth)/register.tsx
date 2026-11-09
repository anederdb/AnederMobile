import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Logo } from '@/components/Logo';
import { Screen } from '@/components/Screen';
import { Button, Checkbox, ErrorText, Field } from '@/components/ui';
import { t } from '@/i18n/tr';
import { setPendingAvatar } from '@/lib/avatar';
import type { PickedImage } from '@/lib/cover';
import { pickAvatar } from '@/lib/photos';
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
  const [accepted, setAccepted] = useState(false);
  const [photo, setPhoto] = useState<PickedImage | null>(null);
  const router = useRouter();

  async function submit() {
    setError('');
    if (!fullName.trim() || !phone.trim() || !email.trim() || !password) return setError(t.auth.required);
    if (password.length < 6) return setError(t.auth.passwordShort);
    if (!photo) return setError(t.auth.photoRequired);
    if (!accepted) return setError(t.auth.consentRequired);
    setBusy(true);
    setPendingAvatar(photo); // uploaded once the user has a session (see the photo screen)
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim(), phone: phone.trim(), terms_accepted: true, email_consent: true } },
    });
    setBusy(false);
    if (err) {
      setPendingAvatar(null);
      return setError(t.auth.registerFailed);
    }
    // With email confirmation on, no session is returned until the link is opened.
    if (!data.session) setNotice(t.auth.checkEmail);
  }

  return (
    <Screen centered>
      <Logo size={96} />
      <Text style={[type.display, { textAlign: 'center', marginBottom: space.sm }]}>{t.auth.registerTitle}</Text>
      <View style={{ alignItems: 'center', gap: space.sm }}>
        <Avatar url={photo?.uri} name={fullName} size={96} />
        <Button title={photo ? t.auth.photoChange : t.auth.photoChoose} variant="secondary" onPress={async () => setPhoto((await pickAvatar()) ?? photo)} />
      </View>
      <Field label={t.auth.fullName} value={fullName} onChangeText={setFullName} autoCapitalize="words" autoComplete="name" />
      <Field label={t.auth.phone} value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
      <Field label={t.auth.email} value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
      <Field label={t.auth.password} value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
      <Checkbox checked={accepted} onChange={setAccepted}>
        <Text style={type.caption}>
          {t.auth.consentPrefix}
          <Text style={{ color: colors.primary, fontWeight: '600' }} onPress={() => router.push('/kullanim-sartlari')}>
            {t.auth.terms}
          </Text>
          {t.auth.consentAnd}
          <Text style={{ color: colors.primary, fontWeight: '600' }} onPress={() => router.push('/aydinlatma')}>
            {t.auth.privacy}
          </Text>
          {t.auth.consentSuffix}
        </Text>
      </Checkbox>
      {error ? <ErrorText>{error}</ErrorText> : null}
      {notice ? <Text accessibilityRole="alert" style={type.label}>{notice}</Text> : null}
      <Button title={t.auth.register} onPress={submit} disabled={busy} />
      <Link href="/login" style={{ textAlign: 'center', color: colors.primary, fontWeight: '600', paddingVertical: space.sm }}>
        {t.auth.toLogin}
      </Link>
    </Screen>
  );
}
