import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Button, ErrorText, Field } from '@/components/ui';
import { t } from '@/i18n/tr';
import { confirm } from '@/lib/confirm';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { colors, radius, space, type } from '@/theme';

export default function Profile() {
  const { profile, refreshProfile } = useSession();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setPhone(profile?.phone ?? '');
  }, [profile]);

  if (!profile) return null;

  async function save() {
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), phone: phone.trim() })
      .eq('id', profile!.id);
    setFailed(!!error);
    setMessage(error ? t.common.error : t.profile.saved);
    if (!error) await refreshProfile();
  }

  async function deleteAccount() {
    if (!(await confirm(t.profile.deleteTitle, t.profile.deleteBody))) return;
    const { error } = await supabase.functions.invoke('delete-account');
    if (error) {
      setFailed(true);
      return setMessage(t.common.error);
    }
    await supabase.auth.signOut({ scope: 'local' }); // the user no longer exists server-side
  }

  return (
    <Screen>
      <Text style={type.display}>{t.profile.title}</Text>
      <View
        style={{
          alignSelf: 'flex-start',
          backgroundColor: colors.surface,
          borderRadius: radius.pill,
          paddingHorizontal: space.md,
          paddingVertical: space.xs,
        }}>
        <Text style={type.label}>
          {t.profile.role[profile.role]} · {t.profile.status[profile.status]}
        </Text>
      </View>
      <Field label={t.auth.fullName} value={fullName} onChangeText={setFullName} autoCapitalize="words" />
      <Field label={t.auth.phone} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      {message ? (failed ? <ErrorText>{message}</ErrorText> : <Text accessibilityRole="alert" style={type.label}>{message}</Text>) : null}
      <Button title={t.common.save} onPress={save} />
      <Link href="/profil/firms" asChild>
        <Button title={t.profile.firms} variant="secondary" onPress={() => {}} />
      </Link>
      {profile.role === 'admin' ? (
        <>
          <Text style={[type.title, { marginTop: space.md }]}>{t.admin.title}</Text>
          <Link href="/admin/events" asChild>
            <Button title={t.admin.events} variant="secondary" onPress={() => {}} />
          </Link>
          <Link href="/admin/announcements" asChild>
            <Button title={t.admin.announcements} variant="secondary" onPress={() => {}} />
          </Link>
          <Link href="/admin/members" asChild>
            <Button title={t.admin.members} variant="secondary" onPress={() => {}} />
          </Link>
        </>
      ) : null}
      <View style={{ height: space.md }} />
      <Button title={t.auth.logout} variant="secondary" onPress={() => supabase.auth.signOut()} />
      <Button title={t.profile.deleteAccount} variant="danger" onPress={deleteAccount} />
    </Screen>
  );
}
