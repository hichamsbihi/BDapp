import { useAppStore } from './index';

export const useHeroProfile = () => useAppStore((s) => s.heroProfile);
export const useStories = () => useAppStore((s) => s.stories);
export const useCurrentStory = () => useAppStore((s) => s.currentStory);
export const useHasCompletedOnboarding = () =>
  useAppStore((s) => s.hasCompletedOnboarding);
export const useCredits = () => useAppStore((s) => s.credits);
export const useIsPremium = () => useAppStore((s) => s.isPremium);

export const useRewardCredits = () => useAppStore((s) => s.rewardCredits);
export const useUpdateHeroProfile = () => useAppStore((s) => s.updateHeroProfile);
export const useCanAfford = () => useAppStore((s) => s.canAfford);
