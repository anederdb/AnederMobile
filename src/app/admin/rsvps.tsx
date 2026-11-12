import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Screen } from '@/components/Screen';
import { TitleLabel } from '@/components/TitleLabel';
import { Badge, Card, Chip, EmptyState } from '@/components/ui';
import { t } from '@/i18n/tr';
import { formatTrDateTime } from '@/lib/dates';
import { groupRsvps, type RsvpStatus } from '@/lib/rsvp';
import { supabase } from '@/lib/supabase';
import type { AppEvent, Profile } from '@/lib/types';
import { space, type } from '@/theme';

type Member = Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'title'>;

function Group({ title, tone, people }: { title: string; tone: 'success' | 'neutral' | 'info'; people: Member[] }) {
  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm }}>
        <Text accessibilityRole="header" style={type.title}>
          {title}
        </Text>
        <Badge label={String(people.length)} tone={tone} />
      </View>
      {people.length === 0 ? <Text style={type.caption}>{t.rsvp.emptyGroup}</Text> : null}
      {people.map((m) => (
        <Card key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Avatar url={m.avatar_url} name={m.full_name} size={44} />
          <View style={{ flex: 1, gap: space.xs }}>
            <Text style={type.heading}>{m.full_name}</Text>
            <TitleLabel title={m.title} />
          </View>
        </Card>
      ))}
    </>
  );
}

export default function Rsvps() {
  const { eventId: initial } = useLocalSearchParams<{ eventId?: string }>();
  const [events, setEvents] = useState<AppEvent[] | null>(null);
  const [eventId, setEventId] = useState<string | null>(initial ?? null);
  const [members, setMembers] = useState<Member[]>([]);
  const [answers, setAnswers] = useState<{ member_id: string; status: RsvpStatus }[]>([]);

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .order('starts_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        const list = (data as AppEvent[]) ?? [];
        setEvents(list);
        setEventId((cur) => cur ?? list[0]?.id ?? null);
      });
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, title')
      .eq('status', 'approved')
      .order('full_name')
      .then(({ data }) => setMembers((data as Member[]) ?? []));
  }, []);

  useEffect(() => {
    if (!eventId) return setAnswers([]);
    let active = true;
    supabase
      .from('event_rsvps')
      .select('member_id, status')
      .eq('event_id', eventId)
      .then(({ data }) => active && setAnswers((data as { member_id: string; status: RsvpStatus }[]) ?? []));
    return () => {
      active = false;
    };
  }, [eventId]);

  const groups = useMemo(() => groupRsvps(members, answers), [members, answers]);

  return (
    <Screen>
      {events && events.length === 0 ? <EmptyState icon="calendar-outline" title={t.events.empty} /> : null}
      <View style={{ gap: space.sm }}>
        {(events ?? []).map((e) => (
          <Chip key={e.id} label={`${e.title} · ${formatTrDateTime(e.starts_at)}`} selected={eventId === e.id} onPress={() => setEventId(e.id)} />
        ))}
      </View>
      {eventId ? (
        <>
          <Group title={t.rsvp.goingGroup} tone="success" people={groups.going} />
          <Group title={t.rsvp.notGoingGroup} tone="neutral" people={groups.notGoing} />
          <Group title={t.rsvp.noReplyGroup} tone="info" people={groups.noReply} />
        </>
      ) : null}
    </Screen>
  );
}
