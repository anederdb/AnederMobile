import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { ListingCard } from '@/components/ListingCard';
import { Screen } from '@/components/Screen';
import { TitleLabel } from '@/components/TitleLabel';
import { Badge, Button, Card, EmptyState, ErrorText, ListGroup, ListRow, SectionHeader } from '@/components/ui';
import { t } from '@/i18n/tr';
import { confirm } from '@/lib/confirm';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import type { Listing } from '@/lib/types';
import { colors, space, type } from '@/theme';

function ContactLine({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ionicons name={icon} size={16} color={colors.muted} />
      <Text style={[type.body, { flex: 1 }]}>{text}</Text>
    </View>
  );
}

export default function Profile() {
  const { profile, session } = useSession();
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

  const canScan = profile.role === 'admin' || profile.role === 'scanner';

  return (
    <Screen>
      <Text style={type.display}>{t.profile.title}</Text>

      <Card style={{ gap: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Avatar url={profile.avatar_url} name={profile.full_name} size={80} />
          <View style={{ flex: 1, gap: space.xs }}>
            <Text style={type.title}>{profile.full_name}</Text>
            <TitleLabel title={profile.title} />
          </View>
        </View>
        <View style={{ gap: space.sm }}>
          {profile.phone ? <ContactLine icon="call-outline" text={profile.phone} /> : null}
          {session?.user.email ? <ContactLine icon="mail-outline" text={session.user.email} /> : null}
        </View>
        <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
          <Badge label={t.profile.role[profile.role]} tone="neutral" />
          <Badge label={t.profile.status[profile.status]} tone={profile.status === 'approved' ? 'success' : 'info'} />
        </View>
      </Card>

      <ListGroup>
        <ListRow icon="create-outline" title={t.profile.edit} onPress={() => router.push('/profil/edit')} />
        <ListRow icon="qr-code-outline" title={t.qr.openMy} onPress={() => router.push('/profil/qr')} />
        {canScan ? <ListRow icon="scan-outline" title={t.qr.openScan} onPress={() => router.push('/profil/scan')} /> : null}
        <ListRow icon="business-outline" title={t.profile.firms} onPress={() => router.push('/profil/firms')} />
      </ListGroup>

      <SectionHeader title={t.profile.myListings} />
      {mine.length === 0 ? <EmptyState icon="document-text-outline" title={t.profile.noListings} /> : null}
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
          <SectionHeader title={t.admin.title} />
          <ListGroup>
            <ListRow icon="calendar-outline" title={t.admin.events} onPress={() => router.push('/admin/events')} />
            <ListRow icon="megaphone-outline" title={t.admin.announcements} onPress={() => router.push('/admin/announcements')} />
            <ListRow icon="checkmark-done-outline" title={t.qr.attendance} onPress={() => router.push('/admin/attendance')} />
            <ListRow icon="pricetag-outline" title={t.admin.offers} onPress={() => router.push('/admin/offers')} />
            <ListRow icon="notifications-outline" title={t.admin.sendPush} onPress={() => router.push('/admin/send-push')} />
            <ListRow icon="people-outline" title={t.admin.members} onPress={() => router.push('/admin/members')} />
          </ListGroup>
        </>
      ) : null}

      <View style={{ height: space.sm }} />
      <Button title={t.auth.logout} variant="secondary" icon={<Ionicons name="log-out-outline" size={20} color={colors.ink} />} onPress={() => supabase.auth.signOut()} />
      <Button title={t.profile.deleteAccount} variant="danger" onPress={deleteAccount} />
    </Screen>
  );
}
