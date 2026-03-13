/**
 * Subscribes to the store and syncs stars, profile, and unlocked universes to Supabase
 * when the user is connected. Debounced to avoid excessive writes.
 */

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store';
import { getCurrentUser } from '@/services/authService';
import { syncStars, syncProfileFromStore } from '@/services/syncService';

const DEBOUNCE_MS = 800;

export function useStoreSync(): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevRef = useRef<string>('');

  useEffect(() => {
    const unsubscribe = useAppStore.subscribe((state) => {
      const payload = {
        stars: state.stars ?? 0,
        heroProfile: state.heroProfile,
        unlockedUniverses: state.unlockedUniverses ?? [],
        isPremium: state.isPremium,
      };
      const key = JSON.stringify({
        s: payload.stars,
        n: payload.heroProfile?.name,
        a: payload.heroProfile?.avatarId,
        u: payload.unlockedUniverses.slice().sort(),
        p: payload.isPremium,
      });
      if (key === prevRef.current) return;
      prevRef.current = key;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(async () => {
        timeoutRef.current = null;
        const user = await getCurrentUser();
        if (!user) return;
        try {
          await syncStars(payload.stars);
          await syncProfileFromStore({
            username: payload.heroProfile?.name ?? null,
            selected_avatar_id: payload.heroProfile?.avatarId ?? null,
            age: payload.heroProfile?.age ?? null,
            gender: payload.heroProfile?.gender ?? null,
            unlocked_universe_ids: payload.unlockedUniverses,
            is_premium: payload.isPremium,
          });
        } catch (e) {
          if (__DEV__) console.log('useStoreSync error:', e);
        }
      }, DEBOUNCE_MS);
    });

    const initialTimer = setTimeout(async () => {
      const user = await getCurrentUser();
      if (!user) return;
      const state = useAppStore.getState();
      try {
        await syncStars(state.stars ?? 0);
        await syncProfileFromStore({
          username: state.heroProfile?.name ?? null,
          selected_avatar_id: state.heroProfile?.avatarId ?? null,
          age: state.heroProfile?.age ?? null,
          gender: state.heroProfile?.gender ?? null,
          unlocked_universe_ids: state.unlockedUniverses ?? [],
          is_premium: state.isPremium,
        });
      } catch (e) {
        if (__DEV__) console.log('useStoreSync initial error:', e);
      }
    }, 1000);

    return () => {
      clearTimeout(initialTimer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      unsubscribe();
    };
  }, []);
}
