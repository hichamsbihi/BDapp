import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, HeroProfile, Story } from '@/types';
import {
  INITIAL_STARS,
  UNIVERSE_UNLOCK_COST,
  REWARD_WATCH_AD,
  REWARD_STORY_COMPLETE,
  REWARD_DAILY_BONUS,
  COUNTDOWN_REWARD,
  COUNTDOWN_HOURS,
} from '@/constants/stars';

/**
 * Check if we're in a new calendar day (for daily bonus)
 */
const isNewDay = (lastDate: string | null): boolean => {
  if (!lastDate) return true;
  const last = new Date(lastDate);
  const now = new Date();
  return (
    last.getFullYear() !== now.getFullYear() ||
    last.getMonth() !== now.getMonth() ||
    last.getDate() !== now.getDate()
  );
};

/**
 * Check if 12h have passed since last countdown claim
 */
const canClaimCountdown = (lastDate: string | null): boolean => {
  if (!lastDate) return true;
  const last = new Date(lastDate);
  const now = new Date();
  const elapsedMs = now.getTime() - last.getTime();
  return elapsedMs >= COUNTDOWN_HOURS * 60 * 60 * 1000;
};

/**
 * Mock ad watch - replace with real SDK integration later
 */
const mockWatchAd = (): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, 1500));
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Hero profile state
      heroProfile: null,
      setHeroProfile: (profile: HeroProfile) => set({ heroProfile: profile }),
      updateHeroProfile: (updates: Partial<HeroProfile>) =>
        set((state) => ({
          heroProfile: state.heroProfile
            ? { ...state.heroProfile, ...updates }
            : null,
        })),
      clearHeroProfile: () => set({ heroProfile: null }),

      // Current story state (story being created)
      currentStory: null,
      setCurrentStory: (story: Partial<Story>) => set({ currentStory: story }),
      updateCurrentStory: (updates: Partial<Story>) =>
        set((state) => ({
          currentStory: state.currentStory
            ? { ...state.currentStory, ...updates }
            : null,
        })),
      clearCurrentStory: () => set({ currentStory: null }),

      // Stories library
      stories: [],
      addStory: (story: Story) =>
        set((state) => ({ stories: [...state.stories, story] })),
      setStories: (stories: Story[]) => set({ stories: Array.isArray(stories) ? stories : [] }),
      removeStory: (storyId: string) =>
        set((state) => ({
          stories: state.stories.filter((s) => s.id !== storyId),
        })),
      updateStory: (storyId: string, updates: Partial<Story>) =>
        set((state) => ({
          stories: state.stories.map((s) =>
            s.id === storyId ? { ...s, ...updates } : s
          ),
        })),

      // Stars (narrative currency - non-monetary)
      stars: INITIAL_STARS,
      unlockedUniverses: [],
      lastDailyBonusDate: null,
      lastCountdownClaimDate: null,
      addStars: (amount: number) =>
        set((state) => ({
          stars: Math.max(0, (state.stars ?? INITIAL_STARS) + amount),
        })),
      setStarsFromServer: (amount: number) =>
        set({ stars: Math.max(0, amount) }),
      setUnlockedUniverses: (ids: string[]) =>
        set({ unlockedUniverses: Array.isArray(ids) ? ids : [] }),
      addUnlockedUniverse: (universeId: string) =>
        set((s) => {
          const list = s.unlockedUniverses ?? [];
          if (list.includes(universeId)) return s;
          return { unlockedUniverses: [...list, universeId] };
        }),
      spendStars: (amount: number) => {
        const state = get();
        const current = state.stars ?? INITIAL_STARS;
        if (current < amount) return false;
        set({ stars: current - amount });
        return true;
      },
      canAfford: (amount: number) => {
        const current = get().stars ?? INITIAL_STARS;
        return current >= amount;
      },
      rewardStar: async (type) => {
        const state = get();
        let amount = 0;

        switch (type) {
          case 'watch_ad':
            await mockWatchAd();
            amount = REWARD_WATCH_AD;
            break;
          case 'story_complete':
            amount = REWARD_STORY_COMPLETE;
            break;
          case 'daily_bonus':
            if (!isNewDay(state.lastDailyBonusDate)) return 0;
            amount = REWARD_DAILY_BONUS;
            set({ lastDailyBonusDate: new Date().toISOString() });
            break;
          case 'countdown_bonus':
            if (!canClaimCountdown(state.lastCountdownClaimDate)) return 0;
            amount = COUNTDOWN_REWARD;
            set({ lastCountdownClaimDate: new Date().toISOString() });
            break;
          default:
            return 0;
        }

        if (amount > 0) {
          set((s) => ({
            stars: Math.max(0, (s.stars ?? INITIAL_STARS) + amount),
          }));
        }
        return amount;
      },
      unlockUniverse: (universeId: string) => {
        const state = get();
        if (!state.canAfford(UNIVERSE_UNLOCK_COST)) return false;
        if (state.unlockedUniverses?.includes(universeId)) return true;
        if (!state.spendStars(UNIVERSE_UNLOCK_COST)) return false;
        set((s) => ({
          unlockedUniverses: [...(s.unlockedUniverses ?? []), universeId],
        }));
        return true;
      },

      // Premium status
      isPremium: false,
      setIsPremium: (status: boolean) => set({ isPremium: status }),

      // Onboarding status
      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: (status: boolean) =>
        set({ hasCompletedOnboarding: status }),

      // Story progress from server (for "Continue in X")
      storyProgressList: [],
      setStoryProgressList: (list) => set({ storyProgressList: list }),

      resetStoreForSignOut: () =>
        set({
          heroProfile: null,
          stories: [],
          hasCompletedOnboarding: false,
          stars: INITIAL_STARS,
          unlockedUniverses: [],
          lastDailyBonusDate: null,
          lastCountdownClaimDate: null,
          currentStory: null,
          storyProgressList: [],
        }),
    }),
    {
      name: 'story-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        heroProfile: state.heroProfile,
        stories: state.stories,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        stars: state.stars,
        unlockedUniverses: state.unlockedUniverses,
        lastDailyBonusDate: state.lastDailyBonusDate,
        lastCountdownClaimDate: state.lastCountdownClaimDate,
      }),
      version: 2,
      migrate: (persistedState: any) => {
        return {
          ...persistedState,
          stars: persistedState?.stars ?? INITIAL_STARS,
          unlockedUniverses: persistedState?.unlockedUniverses ?? [],
          lastDailyBonusDate: persistedState?.lastDailyBonusDate ?? null,
          lastCountdownClaimDate: persistedState?.lastCountdownClaimDate ?? null,
        };
      },
    }
  )
);

// Selector hooks for better performance
export const useHeroProfile = () => useAppStore((state) => state.heroProfile);
export const useCurrentStory = () => useAppStore((state) => state.currentStory);
export const useStories = () => useAppStore((state) => state.stories);
export const useIsPremium = () => useAppStore((state) => state.isPremium);
export const useHasCompletedOnboarding = () =>
  useAppStore((state) => state.hasCompletedOnboarding);
export const useStars = () => useAppStore((state) => state.stars);