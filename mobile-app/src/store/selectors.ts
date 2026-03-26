import { useAppStore } from './index';

/**
 * Selector hooks for Zustand slices used in more than one module.
 * Prefer these over inline `useAppStore((s) => s.x)` for stable references and clarity.
 */

export const useHeroProfile = () => useAppStore((s) => s.heroProfile);
export const useStories = () => useAppStore((s) => s.stories);
export const useCurrentStory = () => useAppStore((s) => s.currentStory);
export const useHasCompletedOnboarding = () =>
  useAppStore((s) => s.hasCompletedOnboarding);
export const useStars = () => useAppStore((s) => s.stars);
export const useIsPremium = () => useAppStore((s) => s.isPremium);
export const useStoryProgressList = () => useAppStore((s) => s.storyProgressList);

export const useRewardStar = () => useAppStore((s) => s.rewardStar);
export const useUpdateHeroProfile = () => useAppStore((s) => s.updateHeroProfile);
export const useCanAfford = () => useAppStore((s) => s.canAfford);
