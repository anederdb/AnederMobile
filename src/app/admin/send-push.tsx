import { useState } from 'react';
import { Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { Button, ErrorText, Field } from '@/components/ui';
import { t } from '@/i18n/tr';
import { confirm } from '@/lib/confirm';
import { supabase } from '@/lib/supabase';
import { type } from '@/theme';

export default function SendPush() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    setResult('');
    if (!title.trim() || !body.trim()) return setError(t.auth.required);
    if (!(await confirm(t.admin.sendPush, t.admin.pushConfirm, t.admin.pushConfirmAction))) return;
    setBusy(true);
    const { data, error: err } = await supabase.functions.invoke('send-push', { body: { title, body } });
    setBusy(false);
    if (err) return setError(t.common.error);
    setResult(
      data.sent === 0 ? t.admin.pushNoDevices : `${data.sent} ${t.admin.pushSent}${data.failed ? ` (${data.failed} ${t.admin.pushFailed})` : ''}`,
    );
    setTitle('');
    setBody('');
  }

  return (
    <Screen>
      <Field label={t.admin.pushTitle} value={title} onChangeText={setTitle} autoCapitalize="sentences" maxLength={100} />
      <Field
        label={t.admin.pushBody}
        value={body}
        onChangeText={setBody}
        autoCapitalize="sentences"
        multiline
        maxLength={500}
        style={{ minHeight: 120, textAlignVertical: 'top', paddingTop: 12 }}
      />
      {error ? <ErrorText>{error}</ErrorText> : null}
      {result ? <Text accessibilityRole="alert" style={type.heading}>{result}</Text> : null}
      <Button title={t.admin.pushSend} onPress={submit} disabled={busy} />
    </Screen>
  );
}
