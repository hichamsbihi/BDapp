import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, HeroProfile, Story } from '@/types';
import {
  INITIAL_STARS,
  REWARD_WATCH_AD,
} from '@/constants/stars';

const INITIAL_CREDITS = INITIAL_STARS;

const mockWatchAd = (): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, 1500));
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      heroProfile: null,
      setHeroProfile: (profile: HeroProfile) => set({ heroProfile: profile }),
      updateHeroProfile: (updates: Partial<HeroProfile>) =>
        set((state) => ({
          heroProfile: state.heroProfile
            ? { ...state.heroProfile, ...updates }
            : null,
        })),
      clearHeroProfile: () => set({ heroProfile: null }),

      currentStory: null,
      setCurrentStory: (story: Partial<Story>) => set({ currentStory: story }),
      updateCurrentStory: (updates: Partial<Story>) =>
        set((state) => ({
          currentStory: state.currentStory
            ? { ...state.currentStory, ...updates }
            : null,
        })),
      clearCurrentStory: () => set({ currentStory: null }),

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

      credits: INITIAL_CREDITS,
      unlockedStories: [],

      addCredits: (amount: number) =>
        set((state) => ({
          credits: Math.max(0, (state.credits ?? INITIAL_CREDITS) + amount),
        })),
      setCreditsFromServer: (amount: number) =>
        set({ credits: Math.max(0, amount) }),
      setUnlockedStories: (ids: string[]) =>
        set({ unlockedStories: Array.isArray(ids) ? ids : [] }),
      addUnlockedStory: (storyId: string) =>
        set((s) => {
          const list = s.unlockedStories ?? [];
          if (list.includes(storyId)) return s;
          return { unlockedStories: [...list, storyId] };
        }),
      spendCredits: (amount: number) => {
        const state = get();
        const current = state.credits ?? INITIAL_CREDITS;
        if (current < amount) return false;
        set({ credits: current - amount });
        return true;
      },
      canAfford: (amount: number) => {
        const current = get().credits ?? INITIAL_CREDITS;
        return current >= amount;
      },
      rewardCredits: async (type) => {
        let amount = 0;

        switch (type) {
          case 'watch_ad':
            await mockWatchAd();
            amount = REWARD_WATCH_AD;
            break;
          default:
            return 0;
        }

        if (amount > 0) {
          set((s) => ({
            credits: Math.max(0, (s.credits ?? INITIAL_CREDITS) + amount),
          }));
        }
        return amount;
      },
      unlockStory: (storyId: string, cost: number) => {
        const state = get();
        if (state.unlockedStories?.includes(storyId)) return true;
        if (state.isPremium) {
          set((s) => ({
            unlockedStories: [...(s.unlockedStories ?? []), storyId],
          }));
          return true;
        }
        if (!state.canAfford(cost)) return false;
        if (!state.spendCredits(cost)) return false;
        set((s) => ({
          unlockedStories: [...(s.unlockedStories ?? []), storyId],
        }));
        return true;
      },

      isPremium: false,
      setIsPremium: (status: boolean) => set({ isPremium: status }),

      hasEverPurchased: false,
      setHasEverPurchased: (value: boolean) => set({ hasEverPurchased: value }),

      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: (status: boolean) =>
        set({ hasCompletedOnboarding: status }),

      storyProgressList: [],
      setStoryProgressList: (list) => set({ storyProgressList: list }),

      resetStoreForSignOut: () =>
        set({
          heroProfile: null,
          stories: [],
          hasCompletedOnboarding: false,
          credits: INITIAL_CREDITS,
          unlockedStories: [],
          isPremium: false,
          hasEverPurchased: false,
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
        credits: state.credits,
        unlockedStories: state.unlockedStories,
        isPremium: state.isPremium,
        hasEverPurchased: state.hasEverPurchased,
      }),
      version: 7,
      migrate: (persistedState: any) => {
        return {
          ...persistedState,
          credits: persistedState?.credits ?? persistedState?.stars ?? INITIAL_CREDITS,
          unlockedStories: persistedState?.unlockedStories ?? [],
          isPremium: persistedState?.isPremium ?? false,
          hasEverPurchased: persistedState?.hasEverPurchased ?? false,
        };
      },
    }
  )
);

export const useHeroProfile = () => useAppStore((state) => state.heroProfile);
export const useCurrentStory = () => useAppStore((state) => state.currentStory);
export const useStories = () => useAppStore((state) => state.stories);
export const useIsPremium = () => useAppStore((state) => state.isPremium);
export const useHasCompletedOnboarding = () =>
  useAppStore((state) => state.hasCompletedOnboarding);
export const useCredits = () => useAppStore((state) => state.credits);
