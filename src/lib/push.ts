import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type PushRegistration =
  | { ok: true }
  | { ok: false; reason: 'web' | 'simulator' | 'no-project-id' | 'permission-denied' | 'token-error'; detail?: string };

/** Asks for permission and stores this device's Expo push token for the signed-in user. Reports why it stopped when it can't. */
export async function registerForPush(): Promise<PushRegistration> {
  const stop = (reason: Extract<PushRegistration, { ok: false }>['reason'], detail?: string): PushRegistration => {
    console.warn(`[push] registration stopped: ${reason}${detail ? ` (${detail})` : ''}`);
    return { ok: false, reason, detail };
  };
  if (Platform.OS === 'web') return stop('web');
  if (!Device.isDevice) return stop('simulator');
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return stop('no-project-id'); // needs `eas init`; see README

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Genel',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return stop('permission-denied');

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const { error } = await supabase.rpc('register_push_token', { p_token: token });
    if (error) return stop('token-error', error.message);
  } catch (e) {
    return stop('token-error', e instanceof Error ? e.message : String(e));
  }
  return { ok: true };
}

/** The event id carried by a notification, if any. */
export function eventIdFrom(response: Notifications.NotificationResponse): string | null {
  const id = response.notification.request.content.data?.eventId;
  return typeof id === 'string' ? id : null;
}
