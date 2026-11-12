import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Badge, ErrorText } from '@/components/ui';
import { t } from '@/i18n/tr';
import { canRsvp, nextRsvp, type RsvpStatus } from '@/lib/rsvp';
import { useSession } from '@/lib/session';
import { singleFlight } from '@/lib/singleFlight';
import { supabase } from '@/lib/supabase';
import { colors, radius, space, type } from '@/theme';

const OPTIONS: { status: RsvpStatus; label: string; icon: React.ComponentProps<typeof Ionicons>['name']; selectedBg: string }[] = [
  { status: 'going', label: t.rsvp.going, icon: 'checkmark-circle-outline', selectedBg: colors.success },
  { status: 'not_going', label: t.rsvp.notGoing, icon: 'close-circle-outline', selectedBg: colors.ink },
];

/** "Katılacağım" / "Katılamayacağım" for one etkinlik. Tapping the chosen answer again clears it. */
export function RsvpButtons({ eventId, startsAt }: { eventId: string; startsAt: string }) {
  const { session } = useSession();
  const userId = session?.user.id;
  const [status, setStatus] = useState<RsvpStatus | null | undefined>(undefined); // undefined = loading
  const [error, setError] = useState('');
  const open = canRsvp(startsAt);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    supabase
      .from('event_rsvps')
      .select('status')
      .eq('event_id', eventId)
      .eq('member_id', userId)
      .maybeSingle()
      .then(({ data }) => active && setStatus((data as { status: RsvpStatus } | null)?.status ?? null));
    return () => {
      active = false;
    };
  }, [eventId, userId]);

  const choose = useMemo(
    () =>
      singleFlight(async (tapped: RsvpStatus) => {
        if (!userId || status === undefined) return;
        setError('');
        const next = nextRsvp(status, tapped);
        const { error: err } = next
          ? await supabase
              .from('event_rsvps')
              .upsert({ event_id: eventId, member_id: userId, status: next, updated_at: new Date().toISOString() }, { onConflict: 'event_id,member_id' })
          : await supabase.from('event_rsvps').delete().eq('event_id', eventId).eq('member_id', userId);
        if (err) return setError(t.common.error);
        setStatus(next);
      }),
    [eventId, userId, status],
  );

  if (!open) {
    return (
      <View style={{ gap: space.xs }}>
        <Text style={type.caption}>{t.rsvp.closed}</Text>
        {status ? <Badge label={`${t.rsvp.yourAnswer}: ${status === 'going' ? t.rsvp.going : t.rsvp.notGoing}`} tone="neutral" /> : null}
      </View>
    );
  }

  return (
    <View style={{ gap: space.sm }}>
      <Text accessibilityRole="header" style={type.heading}>
        {t.rsvp.title}
      </Text>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {OPTIONS.map((o) => {
          const selected = status === o.status;
          return (
            <Pressable
              key={o.status}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: status === undefined }}
              disabled={status === undefined}
              onPress={() => choose(o.status)}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 56,
                borderRadius: radius.md,
                paddingHorizontal: space.sm,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: selected ? o.selectedBg : colors.surface,
                borderWidth: 1,
                borderColor: selected ? o.selectedBg : colors.border,
                opacity: status === undefined ? 0.5 : pressed ? 0.8 : 1,
              })}>
              <Ionicons name={selected ? (o.status === 'going' ? 'checkmark-circle' : 'close-circle') : o.icon} size={20} color={selected ? colors.onPrimary : colors.ink} />
              <Text style={{ color: selected ? colors.onPrimary : colors.ink, fontWeight: '700', fontSize: 15, flexShrink: 1, textAlign: 'center' }}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={type.caption}>{t.rsvp.hint}</Text>
      {error ? <ErrorText>{error}</ErrorText> : null}
    </View>
  );
}
