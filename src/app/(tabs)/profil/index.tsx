import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { ListingCard } from '@/components/ListingCard';
import { Screen } from '@/components/Screen';
import { TitleLabel } from '@/components/TitleLabel';
import { Button, ErrorText } from '@/components/ui';
import { t } from '@/i18n/tr';
import { confirm } from '@/lib/confirm';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import type { Listing } from '@/lib/types';
import { colors, radius, space, type } from '@/theme';

export default function Profile() {
  const { profile } = useSession();
  const router = useRouter();
  const [mine, setMine] = useState<Listing[]>([]);
  const [message, setMessage] = useState('');

  const loadMine = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: false });
    setMine((data as Listing[]) ?? []);
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      loadMine();
    }, [loadMine]),
  );

  if (!profile) return null;

  async function removeListing(l: Listing) {
    if (!(await confirm(t.listings.deleteConfirm, l.title))) return;
    const { error } = await supabase.from('listings').delete().eq('id', l.id);
    if (error) return setMessage(t.common.error);
    await loadMine();
  }

  async function deleteAccount() {
    if (!(await confirm(t.profile.deleteTitle, t.profile.deleteBody))) return;
    const { error } = await supabase.functions.invoke('delete-account');
    if (error) return setMessage(t.common.error);
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
      <Text style={type.title}>{profile.full_name}</Text>
      <TitleLabel title={profile.title} />
      {profile.phone ? <Text style={type.body}>{profile.phone}</Text> : null}
      <Button title={t.profile.edit} variant="secondary" onPress={() => router.push('/profil/edit')} />
      <Link href="/profil/firms" asChild>
        <Button title={t.profile.firms} variant="secondary" onPress={() => {}} />
      </Link>
      <Text style={[type.title, { marginTop: space.md }]}>{t.profile.myListings}</Text>
      {mine.length === 0 ? <Text style={type.body}>{t.profile.noListings}</Text> : null}
      {mine.map((l) => (
        <View key={l.id} style={{ gap: space.sm }}>
          <ListingCard listing={l} />
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <View style={{ flex: 1 }}>
              <Button title={t.common.edit} variant="secondary" onPress={() => router.push({ pathname: '/talepler/form', params: { id: l.id } })} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title={t.common.delete} variant="danger" onPress={() => removeListing(l)} />
            </View>
          </View>
        </View>
      ))}
      {message ? <ErrorText>{message}</ErrorText> : null}
      {profile.role === 'admin' ? (
        <>
          <Text style={[type.title, { marginTop: space.md }]}>{t.admin.title}</Text>
          <Link href="/admin/events" asChild>
            <Button title={t.admin.events} variant="secondary" onPress={() => {}} />
          </Link>
          <Link href="/admin/announcements" asChild>
            <Button title={t.admin.announcements} variant="secondary" onPress={() => {}} />
          </Link>
          <Link href="/admin/offers" asChild>
            <Button title={t.admin.offers} variant="secondary" onPress={() => {}} />
          </Link>
          <Link href="/admin/send-push" asChild>
            <Button title={t.admin.sendPush} variant="secondary" onPress={() => {}} />
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
