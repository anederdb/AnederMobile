import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import QRCode from 'react-native-qrcode-svg';
import { Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { ErrorText } from '@/components/ui';
import { t } from '@/i18n/tr';
import { buildQrPayload } from '@/lib/qr';
import { supabase } from '@/lib/supabase';
import { colors, radius, space, type } from '@/theme';

const REFRESH_MS = 60_000; // tokens are valid for 90 seconds

export default function MyQr() {
  const [token, setToken] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const refresh = async () => {
        const { data, error } = await supabase.rpc('issue_qr_token');
        if (!active) return;
        if (error || typeof data !== 'string') return setFailed(true);
        setFailed(false);
        setToken(data);
      };
      refresh();
      const timer = setInterval(refresh, REFRESH_MS);
      return () => {
        active = false;
        clearInterval(timer);
      };
    }, []),
  );

  return (
    <Screen>
      <Text style={type.display}>{t.qr.myTitle}</Text>
      <Text style={type.body}>{t.qr.myHelp}</Text>
      <View style={{ alignSelf: 'center', backgroundColor: '#FFFFFF', padding: space.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border }}>
        {token ? <QRCode value={buildQrPayload(token)} size={240} /> : <View style={{ width: 240, height: 240 }} />}
      </View>
      {failed ? <ErrorText>{t.qr.loadFailed}</ErrorText> : null}
    </Screen>
  );
}
