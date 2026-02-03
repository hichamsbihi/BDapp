import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, HeroProfile, Story } from '@/types';

/**
 * Global application store using Zustand
 * Persisted to AsyncStorage for state restoration across app restarts
 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
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
      // Only persist essential data
      partialize: (state) => ({
        heroProfile: state.heroProfile,
        stories: state.stories,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
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
