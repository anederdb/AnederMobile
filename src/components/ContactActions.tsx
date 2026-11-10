import { Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';

import { Button } from '@/components/ui';
import { t } from '@/i18n/tr';
import { whatsappUrl } from '@/lib/whatsapp';

const WHATSAPP_GREEN = '#25D366';

/** "Ara" and "WhatsApp ile mesaj gönder" buttons for a phone number. */
export function ContactActions({ phone }: { phone: string }) {
  const wa = whatsappUrl(phone);
  return (
    <>
      <Button
        title={`${t.listings.call}: ${phone}`}
        icon={<Ionicons name="call" size={20} color="#FFFFFF" />}
        onPress={() => Linking.openURL(`tel:${phone}`)}
      />
      {wa ? (
        <Button
          title={t.listings.whatsapp}
          variant="secondary"
          icon={<Ionicons name="logo-whatsapp" size={22} color={WHATSAPP_GREEN} />}
          onPress={() => Linking.openURL(wa)}
        />
      ) : null}
    </>
  );
}
