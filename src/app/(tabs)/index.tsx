import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { BirthdayCard } from '@/components/BirthdayCard';
import { EventCard, SectionTitle } from '@/components/EventCard';
import { Logo } from '@/components/Logo';
import { OfferCard } from '@/components/OfferCard';
import { Screen } from '@/components/Screen';
import { NewsCard } from '@/components/NewsCard';
import { Card, EmptyState, SectionHeader, Skeleton } from '@/components/ui';
import { t } from '@/i18n/tr';
import { firstName, isBirthdayToday } from '@/lib/birthday';
import { formatTrDateTime } from '@/lib/dates';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import type { Announcement, AppEvent, NewsItem, Offer } from '@/lib/types';
import { colors, radius, space, type } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function QuickAction({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Card onPress={onPress} accessibilityLabel={label} style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.md, paddingHorizontal: space.sm }}>
        <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={24} color={colors.primary} />
        </View>
        <Text style={[type.label, { textAlign: 'center', color: colors.ink }]} numberOfLines={2}>
          {label}
        </Text>
      </Card>
    </View>
  );
}

export default function Home() {
  const { profile } = useSession();
  const router = useRouter();
  const [next, setNext] = useState<AppEvent | null | undefined>(undefined); // undefined = still loading
  const [news, setNews] = useState<Announcement[] | undefined>(undefined);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [headlines, setHeadlines] = useState<NewsItem[] | undefined>(undefined);
  const [birthday, setBirthday] = useState(false);

  useFocusEffect(
    useCallback(() => {
      // Only the member themselves can read their birth date; a missing row (every existing member) means no celebration.
      if (profile) {
        supabase
          .from('profile_private')
          .select('birth_date')
          .eq('member_id', profile.id)
          .maybeSingle()
          .then(({ data }) => {
            const stored = (data as { birth_date: string | null } | null)?.birth_date;
            setBirthday(!!stored && isBirthdayToday(stored));
          });
      }
      supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3)
        .then(({ data }) => setHeadlines((data as NewsItem[]) ?? []));
      supabase
        .from('events')
        .select('*')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at')
        .limit(1)
        .then(({ data }) => setNext((data as AppEvent[] | null)?.[0] ?? null));
      supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3)
        .then(({ data }) => setNews((data as Announcement[]) ?? []));
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      supabase
        .from('offers')
        .select('*')
        .or(`valid_until.is.null,valid_until.gte.${today}`)
        .order('created_at', { ascending: false })
        .then(({ data }) => setOffers((data as Offer[]) ?? []));
    }, [profile]),
  );

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Logo size={48} />
        <View style={{ flex: 1 }}>
          <Text style={type.caption}>{t.auth.tagline}</Text>
          <Text style={type.heading}>{t.home.welcome}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t.profile.title} onPress={() => router.push('/profil')} hitSlop={8}>
          <Avatar url={profile?.avatar_url} name={profile?.full_name} size={44} />
        </Pressable>
      </View>
      {birthday ? <BirthdayCard name={firstName(profile?.full_name)} /> : null}
      <Text style={type.display}>{profile?.full_name ?? ''}</Text>

      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <QuickAction icon="qr-code-outline" label={t.qr.openMy} onPress={() => router.push('/profil/qr')} />
        <QuickAction icon="add-circle-outline" label={t.listings.add} onPress={() => router.push('/talepler/form')} />
        <QuickAction icon="people-outline" label={t.tabs.members} onPress={() => router.push('/uyeler')} />
        <QuickAction icon="library-outline" label={t.corporate.title} onPress={() => router.push('/kurumsal')} />
      </View>

      <SectionTitle>{t.events.next}</SectionTitle>
      {next === undefined ? <Skeleton height={96} /> : null}
      {next ? <EventCard event={next} /> : null}
      {next === null ? <EmptyState icon="calendar-outline" title={t.events.empty} /> : null}

      <SectionHeader title={t.news.title} action={t.news.all} onAction={() => router.push('/haberler')} />
      {headlines === undefined ? <Skeleton height={120} /> : null}
      {headlines && headlines.length === 0 ? <EmptyState icon="newspaper-outline" title={t.news.empty} /> : null}
      {headlines?.map((n) => (
        <NewsCard key={n.id} item={n} />
      ))}

      {offers.length > 0 ? (
        <>
          <SectionTitle>{t.offers.section}</SectionTitle>
          {offers.map((o) => (
            <OfferCard key={o.id} offer={o} />
          ))}
        </>
      ) : null}

      <SectionTitle>{t.announcements.title}</SectionTitle>
      {news === undefined ? <Skeleton height={88} /> : null}
      {news && news.length === 0 ? <EmptyState icon="megaphone-outline" title={t.announcements.empty} /> : null}
      {news?.map((a) => (
        <Card key={a.id} style={{ gap: space.xs }}>
          <Text style={type.caption}>{formatTrDateTime(a.created_at).slice(0, 10)}</Text>
          <Text style={type.heading}>{a.title}</Text>
          <Text style={type.body}>{a.body}</Text>
        </Card>
      ))}
    </Screen>
  );
}
