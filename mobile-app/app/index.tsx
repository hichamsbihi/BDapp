import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { restoreSession, hydrateStoreFromProfile, signOut } from '@/services/authService';
import { useAppStore } from '@/store';
import { colors } from '@/theme/theme';

/**
 * Auth gate: runs on app start.
 * Session and store are persisted in AsyncStorage; cutting the server does not clear them.
 * - If session exists and server reachable: hydrate profile, then (tabs).
 * - If session exists but server unreachable (e.g. simulate uninstall): sign out, clear store, onboarding.
 * - If no session: clear unlocked universes, then onboarding.
 */
export default function AuthGateScreen() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { session } = await restoreSession();
      if (cancelled) return;
      if (session?.user) {
        const hydrated = await hydrateStoreFromProfile();
        if (cancelled) return;
        if (!hydrated) {
          await signOut();
          useAppStore.getState().resetStoreForSignOut();
          router.replace('/onboarding');
          return;
        }
        router.replace('/(tabs)');
      } else {
        useAppStore.getState().setUnlockedUniverses([]);
        router.replace('/onboarding');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
