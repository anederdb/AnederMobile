import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Button, Chip, ErrorText, Field } from '@/components/ui';
import { t } from '@/i18n/tr';
import { SITE_PAGES, type PageKey } from '@/lib/sitePages';
import { singleFlight } from '@/lib/singleFlight';
import { supabase } from '@/lib/supabase';
import type { SitePage } from '@/lib/types';
import { space, type } from '@/theme';

/** Admins edit the Kurumsal texts. Saving empty text removes the row, so members see the template again. */
export default function ManagePages() {
  const [key, setKey] = useState<PageKey>('hakkimizda');
  const [saved, setSaved] = useState<string | null>(null); // text currently stored for this page (null = none)
  const [body, setBody] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setNote('');
    setError('');
    supabase
      .from('site_pages')
      .select('body')
      .eq('key', key)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const text = (data as Pick<SitePage, 'body'> | null)?.body ?? null;
        setSaved(text);
        setBody(text ?? '');
      });
    return () => {
      active = false;
    };
  }, [key]);

  const save = useMemo(
    () =>
      singleFlight(async () => {
        setError('');
        setNote('');
        setBusy(true);
        try {
          const text = body.trim();
          const { error: err } = text
            ? await supabase.from('site_pages').upsert({ key, body: text, updated_at: new Date().toISOString() }, { onConflict: 'key' })
            : await supabase.from('site_pages').delete().eq('key', key);
          if (err) return setError(t.common.error);
          setSaved(text || null);
          setNote(t.corporate.saved);
        } finally {
          setBusy(false);
        }
      }),
    [key, body],
  );

  return (
    <Screen>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {SITE_PAGES.map((p) => (
          <Chip key={p.key} label={p.title} selected={key === p.key} onPress={() => setKey(p.key)} />
        ))}
      </View>
      {saved === null ? <Text style={type.caption}>{t.corporate.templateNotice}</Text> : null}
      <Field
        label={t.corporate.pageBody}
        value={body}
        onChangeText={setBody}
        autoCapitalize="sentences"
        multiline
        maxLength={20000}
        style={{ minHeight: 220, textAlignVertical: 'top', paddingTop: space.sm }}
      />
      {error ? <ErrorText>{error}</ErrorText> : null}
      {note ? <Text accessibilityRole="alert" style={type.label}>{note}</Text> : null}
      <Button title={t.common.save} onPress={() => save()} loading={busy} />
    </Screen>
  );
}
