import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Text, View } from 'react-native';

import { ListingCard } from '@/components/ListingCard';
import { Screen } from '@/components/Screen';
import { TitleLabel } from '@/components/TitleLabel';
import { Button } from '@/components/ui';
import { t } from '@/i18n/tr';
import { supabase } from '@/lib/supabase';
import type { Firm, Listing, Profile } from '@/lib/types';
import { colors, radius, space, type } from '@/theme';

export default function MemberDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [member, setMember] = useState<Profile | null>(null);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    (async () => {
      const [m, f, l] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
        supabase.from('firms').select('*').eq('owner_id', id).order('created_at'),
        supabase.from('listings').select('*').eq('owner_id', id).order('created_at', { ascending: false }),
      ]);
      setMember(m.data as Profile | null);
      setFirms((f.data as Firm[]) ?? []);
      const rows = (l.data as Listing[]) ?? [];
      setListings(rows);
    })();
  }, [id]);

  if (!member) {
    return (
      <Screen>
        <Text style={type.caption}>{t.common.loading}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={type.display}>{member.full_name}</Text>
      <TitleLabel title={member.title} />
      {member.phone ? <Button title={`${t.listings.call}: ${member.phone}`} onPress={() => Linking.openURL(`tel:${member.phone}`)} /> : null}

      {firms.length > 0 ? <Text style={[type.title, { marginTop: space.sm }]}>{t.members.firms}</Text> : null}
      {firms.map((f) => (
        <View key={f.id} style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.md, gap: space.xs }}>
          <Text style={type.heading}>{f.name}</Text>
          {f.district ? <Text style={type.caption}>{f.district}</Text> : null}
          {f.sahibinden_url ? (
            <Text
              accessibilityRole="link"
              style={{ color: colors.primary, fontWeight: '600', paddingVertical: space.xs }}
              onPress={() => Linking.openURL(f.sahibinden_url!)}>
              {t.firms.open}
            </Text>
          ) : null}
        </View>
      ))}

      <Text style={[type.title, { marginTop: space.sm }]}>{t.members.listings}</Text>
      {listings.length === 0 ? <Text style={type.body}>{t.members.noListings}</Text> : null}
      {listings.map((l) => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </Screen>
  );
}
