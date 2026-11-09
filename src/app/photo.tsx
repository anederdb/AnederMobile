import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Screen } from '@/components/Screen';
import { Button, ErrorText } from '@/components/ui';
import { t } from '@/i18n/tr';
import { takePendingAvatar, uploadAvatar } from '@/lib/avatar';
import type { PickedImage } from '@/lib/cover';
import { pickAvatar } from '@/lib/photos';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { space, type } from '@/theme';

/** Shown to new members who have no profile photo yet. Uploads the signup-form photo automatically if it is still in memory. */
export default function PhotoGate() {
  const { profile, refreshProfile } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const started = useRef(false);

  const upload = useCallback(
    async (image: PickedImage) => {
      if (!profile) return;
      setBusy(true);
      setError('');
      setPreview(image.uri);
      try {
        await uploadAvatar(profile.id, image);
        await refreshProfile(); // clears the gate
      } catch {
        setError(t.common.error);
        setBusy(false);
      }
    },
    [profile, refreshProfile],
  );

  useEffect(() => {
    if (started.current || !profile) return;
    const image = takePendingAvatar();
    if (!image) return;
    started.current = true;
    upload(image);
  }, [profile, upload]);

  return (
    <Screen centered>
      <Text style={[type.title, { textAlign: 'center' }]}>{t.photoGate.title}</Text>
      <Text style={[type.body, { textAlign: 'center' }]}>{t.photoGate.body}</Text>
      <View style={{ alignItems: 'center', marginVertical: space.md }}>
        <Avatar url={preview} name={profile?.full_name} size={128} />
      </View>
      {busy ? <Text style={[type.label, { textAlign: 'center' }]}>{t.photoGate.uploading}</Text> : null}
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button
        title={t.auth.photoChoose}
        disabled={busy}
        onPress={async () => {
          const image = await pickAvatar();
          if (image) await upload(image);
        }}
      />
      <Button title={t.auth.logout} variant="secondary" onPress={() => supabase.auth.signOut()} />
    </Screen>
  );
}
