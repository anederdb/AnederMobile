import { Switch, Text, View } from 'react-native';

import { t } from '@/i18n/tr';
import { colors, space, type } from '@/theme';

type Props = { push: boolean; email: boolean; onPush: (v: boolean) => void; onEmail: (v: boolean) => void };

/** "Bildirim gönder" / "E-posta gönder" switches shown when an admin publishes a duyuru or etkinlik. */
export function PublishToggles({ push, email, onPush, onEmail }: Props) {
  const rows = [
    { label: t.admin.notifyOnPublish, value: push, set: onPush },
    { label: t.admin.emailOnPublish, value: email, set: onEmail },
  ];
  return (
    <>
      {rows.map((r) => (
        <View key={r.label} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md }}>
          <Text style={[type.body, { flex: 1 }]}>{r.label}</Text>
          <Switch value={r.value} onValueChange={r.set} accessibilityLabel={r.label} trackColor={{ true: colors.primary, false: colors.border }} />
        </View>
      ))}
    </>
  );
}
