import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { Button, ErrorText, Field } from '@/components/ui';
import { t } from '@/i18n/tr';
import { useSession } from '@/lib/session';
import { singleFlight } from '@/lib/singleFlight';
import { supabase } from '@/lib/supabase';
import { type } from '@/theme';

export default function EditProfile() {
  const { profile, refreshProfile } = useSession();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setPhone(profile?.phone ?? '');
  }, [profile]);

  const save = useMemo(
    () =>
      singleFlight(async () => {
        setError('');
        if (!fullName.trim()) return setError(t.auth.required);
        const { error: err } = await supabase
          .from('profiles')
          .update({ full_name: fullName.trim(), phone: phone.trim() })
          .eq('id', profile!.id);
        if (err) return setError(t.common.error);
        await refreshProfile();
        router.back();
      }),
    [fullName, phone, profile, refreshProfile, router],
  );

  if (!profile) return null;

  return (
    <Screen>
      <Text style={type.display}>{t.profile.edit}</Text>
      <Field label={t.auth.fullName} value={fullName} onChangeText={setFullName} autoCapitalize="words" />
      <Field label={t.auth.phone} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button title={t.common.save} onPress={() => save()} />
      <Button title={t.common.cancel} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
