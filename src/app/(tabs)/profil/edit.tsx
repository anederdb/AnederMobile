import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { DateTimeField } from '@/components/DateTimeField';
import { Screen } from '@/components/Screen';
import { Button, ErrorText, Field } from '@/components/ui';
import { t } from '@/i18n/tr';
import { uploadAvatar } from '@/lib/avatar';
import { fromBirthDateString, toBirthDateString } from '@/lib/birthday';
import { pickAvatar } from '@/lib/photos';
import { useSession } from '@/lib/session';
import { singleFlight } from '@/lib/singleFlight';
import { supabase } from '@/lib/supabase';
import { space, type } from '@/theme';

export default function EditProfile() {
  const { profile, refreshProfile } = useSession();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [savedBirth, setSavedBirth] = useState<string | null>(null); // what is stored now (null = none yet)
  const [error, setError] = useState('');

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setPhone(profile?.phone ?? '');
  }, [profile]);

  // Existing members have no birth date row yet: a missing row simply means "empty".
  useEffect(() => {
    if (!profile) return;
    supabase
      .from('profile_private')
      .select('birth_date')
      .eq('member_id', profile.id)
      .maybeSingle()
      .then(({ data }) => {
        const stored = (data as { birth_date: string | null } | null)?.birth_date ?? null;
        setSavedBirth(stored);
        setBirthDate(fromBirthDateString(stored));
      });
  }, [profile]);

  const save = useMemo(
    () =>
      singleFlight(async () => {
        setError('');
        if (!fullName.trim()) return setError(t.auth.required);
        const birth = birthDate ? toBirthDateString(birthDate) : null;
        if (birthDate && !birth) return setError(t.auth.birthDateInvalid);
        const { error: err } = await supabase
          .from('profiles')
          .update({ full_name: fullName.trim(), phone: phone.trim() })
          .eq('id', profile!.id);
        if (err) return setError(t.common.error);
        if (birth !== savedBirth) {
          const { error: birthErr } = await supabase
            .from('profile_private')
            .upsert({ member_id: profile!.id, birth_date: birth }, { onConflict: 'member_id' });
          if (birthErr) return setError(t.common.error);
        }
        await refreshProfile();
        router.back();
      }),
    [fullName, phone, birthDate, savedBirth, profile, refreshProfile, router],
  );

  if (!profile) return null;

  return (
    <Screen>
      <Text style={type.display}>{t.profile.edit}</Text>
      <View style={{ alignItems: 'center', gap: space.sm }}>
        <Avatar url={profile.avatar_url} name={profile.full_name} size={96} />
        <Button
          title={t.auth.photoChange}
          variant="secondary"
          onPress={async () => {
            const image = await pickAvatar();
            if (!image) return;
            setError('');
            try {
              await uploadAvatar(profile.id, image);
              await refreshProfile();
            } catch {
              setError(t.common.error);
            }
          }}
        />
      </View>
      <Field label={t.auth.fullName} value={fullName} onChangeText={setFullName} autoCapitalize="words" />
      <Field label={t.auth.phone} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <DateTimeField label={t.auth.birthDateOptional} value={birthDate} onChange={setBirthDate} mode="date" maximumDate={new Date()} />
      <Text style={type.caption}>{t.auth.birthDateHint}</Text>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button title={t.common.save} onPress={() => save()} />
      <Button title={t.common.cancel} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
