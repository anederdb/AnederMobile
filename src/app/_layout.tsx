import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { eventIdFrom, registerForPush } from '@/lib/push';
import { SessionProvider, useSession } from '@/lib/session';

function Routes() {
  const { session, profile, loading, recovering } = useSession();
  const router = useRouter();
  const segments = useSegments() as string[];

  const signedIn = !!session;
  const needsPhoto = signedIn && !recovering && !!profile?.photo_required && !profile.avatar_url;
  const approved = signedIn && !recovering && !needsPhoto && profile?.status === 'approved';
  const pending = signedIn && !recovering && !needsPhoto && !approved;
  const authArea = !signedIn || recovering; // a password-reset link signs the user in, but they must set a new password first

  // Guarded routes have no fallback of their own, so send the user to the area
  // that matches their state whenever they are somewhere else (cold start, sign-out, approval).
  const isAdmin = approved && profile?.role === 'admin';
  const group = authArea ? '(auth)' : needsPhoto ? 'photo' : approved ? '(tabs)' : 'pending';
  const target = recovering ? '/reset' : !signedIn ? '/login' : needsPhoto ? '/photo' : approved ? '/' : '/pending';
  const inAllowedArea =
    (recovering ? segments[0] === '(auth)' && segments[1] === 'reset' : segments[0] === group) ||
    (isAdmin && segments[0] === 'admin') ||
    (approved && (segments[0] === 'haberler' || segments[0] === 'kurumsal')) ||
    segments[0] === 'yasal'; // legal pages are readable signed in or out
  useEffect(() => {
    if (!loading && !inAllowedArea) router.replace(target);
  }, [loading, inAllowedArea, target, router]);

  useEffect(() => {
    if (approved) registerForPush().catch(() => {});
  }, [approved]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const id = eventIdFrom(response);
      if (id) router.push({ pathname: '/etkinlikler/[id]', params: { id } });
    });
    return () => sub.remove();
  }, [router]);

  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={authArea}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={needsPhoto}>
        <Stack.Screen name="photo" />
      </Stack.Protected>
      <Stack.Protected guard={pending}>
        <Stack.Screen name="pending" />
      </Stack.Protected>
      <Stack.Protected guard={approved}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="haberler" />
        <Stack.Screen name="kurumsal" />
      </Stack.Protected>
      <Stack.Screen name="yasal" />
      <Stack.Protected guard={isAdmin}>
        <Stack.Screen name="admin" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <StatusBar style="dark" />
      <Routes />
    </SessionProvider>
  );
}
