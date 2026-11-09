import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Button, Chip, Field } from '@/components/ui';
import { t } from '@/i18n/tr';
import { formatTrDateTime } from '@/lib/dates';
import { parseQrPayload } from '@/lib/qr';
import { supabase } from '@/lib/supabase';
import type { AppEvent } from '@/lib/types';
import { colors, radius, space, type } from '@/theme';

type Outcome = { status: 'ok' | 'already' | 'invalid' | 'error'; name?: string };

const OUTCOME_COLOR = { ok: '#1B7F3B', already: '#B26A00', invalid: colors.primary, error: colors.primary } as const;

/** The event closest to now (past or future). */
function nearest(events: AppEvent[]): AppEvent | null {
  const now = Date.now();
  return events.reduce<AppEvent | null>(
    (best, e) => (!best || Math.abs(new Date(e.starts_at).getTime() - now) < Math.abs(new Date(best.starts_at).getTime() - now) ? e : best),
    null,
  );
}

export default function Scan() {
  const [permission, requestPermission] = useCameraPermissions();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [pasted, setPasted] = useState('');

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .order('starts_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        const rows = (data as AppEvent[]) ?? [];
        setEvents(rows);
        setEventId(nearest(rows)?.id ?? null);
      });
  }, []);

  // One scan at a time: while a result is showing (or a check is running) the camera ignores codes.
  async function handle(raw: string) {
    if (busy || outcome || !eventId) return;
    setBusy(true);
    const token = parseQrPayload(raw);
    if (!token) {
      setOutcome({ status: 'invalid' });
      return setBusy(false);
    }
    const { data, error } = await supabase.rpc('check_in', { p_event_id: eventId, p_token: token });
    setBusy(false);
    if (error || !data) return setOutcome({ status: 'error' });
    setOutcome({ status: data.status, name: data.member_name });
  }

  const scanning = !outcome && !busy;
  const useCamera = Platform.OS !== 'web';

  return (
    <Screen>
      <Text style={type.display}>{t.qr.scanTitle}</Text>
      <Text style={type.label}>{t.qr.pickEvent}</Text>
      <View style={{ gap: space.sm }}>
        {events.map((e) => (
          <Chip key={e.id} label={`${e.title} · ${formatTrDateTime(e.starts_at)}`} selected={eventId === e.id} onPress={() => setEventId(e.id)} />
        ))}
      </View>
      {events.length === 0 ? <Text style={type.body}>{t.events.empty}</Text> : null}

      {outcome ? (
        <View style={{ backgroundColor: OUTCOME_COLOR[outcome.status], borderRadius: radius.lg, padding: space.lg, gap: space.xs }}>
          <Text style={[type.title, { color: '#FFFFFF' }]}>{t.qr.result[outcome.status]}</Text>
          {outcome.name ? <Text style={[type.heading, { color: '#FFFFFF' }]}>{outcome.name}</Text> : null}
        </View>
      ) : null}
      {outcome ? <Button title={t.qr.next} onPress={() => setOutcome(null)} /> : null}

      {useCamera && eventId && !outcome ? (
        permission?.granted ? (
          <CameraView
            style={{ aspectRatio: 1, borderRadius: radius.lg, overflow: 'hidden' }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanning ? (r) => handle(r.data) : undefined}
          />
        ) : (
          <Button title={t.qr.allowCamera} onPress={requestPermission} />
        )
      ) : null}

      {!useCamera && eventId && !outcome ? (
        <>
          <Field label={t.qr.pasteLabel} value={pasted} onChangeText={setPasted} autoCapitalize="none" />
          <Button title={t.qr.check} onPress={() => handle(pasted.trim())} disabled={busy} />
        </>
      ) : null}
    </Screen>
  );
}
