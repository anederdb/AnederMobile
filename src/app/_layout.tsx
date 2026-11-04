import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { SessionProvider, useSession } from '@/lib/session';

function Routes() {
  const { session, profile, loading } = useSession();
  const router = useRouter();
  const segments = useSegments() as string[];

  const signedIn = !!session;
  const approved = signedIn && profile?.status === 'approved';
  const pending = signedIn && !approved;

  // Guarded routes have no fallback of their own, so send the user to the area
  // that matches their state whenever they are somewhere else (cold start, sign-out, approval).
  const group = !signedIn ? '(auth)' : approved ? '(tabs)' : 'pending';
  const target = !signedIn ? '/login' : approved ? '/' : '/pending';
  useEffect(() => {
    if (!loading && segments[0] !== group) router.replace(target);
  }, [loading, segments, group, target, router]);

  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={pending}>
        <Stack.Screen name="pending" />
      </Stack.Protected>
      <Stack.Protected guard={approved}>
        <Stack.Screen name="(tabs)" />
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
