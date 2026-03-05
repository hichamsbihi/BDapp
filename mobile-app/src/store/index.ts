import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, HeroProfile, Story } from '@/types';

// Stars economy constants
const INITIAL_STARS = 3;
const IMAGE_COST = 1;
const UNIVERSE_UNLOCK_COST = 3;
const REWARD_WATCH_AD = 1;
const REWARD_STORY_COMPLETE = 2;
const REWARD_DAILY_BONUS = 1;

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
      addStars: (amount: number) =>
        set((state) => ({
          stars: Math.max(0, (state.stars ?? INITIAL_STARS) + amount),
        })),
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
      }),
      version: 1,
      migrate: (persistedState: any) => {
        return {
          ...persistedState,
          stars: persistedState?.stars ?? INITIAL_STARS,
          unlockedUniverses: persistedState?.unlockedUniverses ?? [],
          lastDailyBonusDate: persistedState?.lastDailyBonusDate ?? null,
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