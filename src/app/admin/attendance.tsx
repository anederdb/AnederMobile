import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Button, Chip } from '@/components/ui';
import { t } from '@/i18n/tr';
import { confirm } from '@/lib/confirm';
import { formatTrDateTime } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import type { AppEvent } from '@/lib/types';
import { colors, radius, space, type } from '@/theme';

type Row = { member_id: string; checked_in_at: string; profiles: { full_name: string | null } | null };

export default function Attendance() {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .order('starts_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        const list = (data as AppEvent[]) ?? [];
        setEvents(list);
        setEventId(list[0]?.id ?? null);
      });
  }, []);

  const load = useCallback(async () => {
    if (!eventId) return setRows([]);
    const { data } = await supabase
      .from('event_checkins')
      .select('member_id, checked_in_at, profiles!member_id(full_name)')
      .eq('event_id', eventId)
      .order('checked_in_at', { ascending: false });
    setRows((data as unknown as Row[]) ?? []);
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(r: Row) {
    if (!(await confirm(t.qr.removeCheckIn, r.profiles?.full_name ?? ''))) return;
    await supabase.rpc('remove_check_in', { p_event_id: eventId, p_member_id: r.member_id });
    await load();
  }

  return (
    <Screen>
      <View style={{ gap: space.sm }}>
        {events.map((e) => (
          <Chip key={e.id} label={`${e.title} · ${formatTrDateTime(e.starts_at)}`} selected={eventId === e.id} onPress={() => setEventId(e.id)} />
        ))}
      </View>
      <Text style={type.title}>
        {t.qr.attendeeCount}: {rows.length}
      </Text>
      {rows.length === 0 ? <Text style={type.body}>{t.qr.noAttendees}</Text> : null}
      {rows.map((r) => (
        <View key={r.member_id} style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.md, gap: space.sm }}>
          <Text style={type.heading}>{r.profiles?.full_name}</Text>
          <Text style={type.caption}>{formatTrDateTime(r.checked_in_at)}</Text>
          <Button title={t.common.delete} variant="danger" onPress={() => remove(r)} />
        </View>
      ))}
    </Screen>
  );
}
