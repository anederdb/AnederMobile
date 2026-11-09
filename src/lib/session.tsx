import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { nextProfile, shouldReloadProfile } from './profileState';
import { parseRecoveryUrl } from './recoveryLink';
import { supabase } from './supabase';
import type { Profile } from './types';

type SessionState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  /** True while the user arrived through a password-reset link and must set a new password. */
  recovering: boolean;
  finishRecovery: () => void;
  refreshProfile: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile((prev) => nextProfile(prev, { data: data as Profile | null, error }));
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      if (event === 'SIGNED_OUT') setRecovering(false);
      if (!shouldReloadProfile(event)) return;
      // defer: supabase calls inside this callback can deadlock the auth lock
      setTimeout(() => loadProfile(next?.user.id), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  // Native: the reset email opens the app through anader://reset#access_token=...&type=recovery
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const handle = async (url: string | null) => {
      const tokens = url ? parseRecoveryUrl(url) : null;
      if (!tokens) return;
      const { error } = await supabase.auth.setSession({ access_token: tokens.accessToken, refresh_token: tokens.refreshToken });
      if (!error) setRecovering(true);
    };
    Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener('url', (e) => handle(e.url));
    return () => sub.remove();
  }, []);

  const finishRecovery = useCallback(() => setRecovering(false), []);

  const value = useMemo<SessionState>(
    () => ({ session, profile, loading, recovering, finishRecovery, refreshProfile: () => loadProfile(session?.user.id) }),
    [session, profile, loading, recovering, finishRecovery, loadProfile],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
