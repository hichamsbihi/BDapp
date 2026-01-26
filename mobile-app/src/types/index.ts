// Hero profile types
export interface HeroProfile {
  id: string;
  name: string;
  age: number;
  gender: 'boy' | 'girl';
  avatarId: string;
}

// Avatar types
export interface Avatar {
  id: string;
  name: string;
  imageUrl: string;
  color?: string;
}

// Universe types
export interface Universe {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  color: string;
}

// Story types
export interface StoryStart {
  id: string;
  universeId: string;
  title: string;
  text: string;
}

export interface StoryPage {
  id: string;
  paragraphText: string;
  imageUrl: string;
  pageNumber: number;
}

export interface Story {
  id: string;
  title: string;
  universeId: string;
  heroId: string;
  pages: StoryPage[];
  createdAt: Date;
  updatedAt: Date;
  isComplete: boolean;
}

// App state types
export interface AppState {
  // Hero
  heroProfile: HeroProfile | null;
  setHeroProfile: (profile: HeroProfile) => void;
  updateHeroProfile: (updates: Partial<HeroProfile>) => void;
  clearHeroProfile: () => void;

  // Current story being created
  currentStory: Partial<Story> | null;
  setCurrentStory: (story: Partial<Story>) => void;
  updateCurrentStory: (updates: Partial<Story>) => void;
  clearCurrentStory: () => void;

  // Saved stories library
  stories: Story[];
  addStory: (story: Story) => void;
  removeStory: (storyId: string) => void;
  updateStory: (storyId: string, updates: Partial<Story>) => void;

  // Premium status
  isPremium: boolean;
  setIsPremium: (status: boolean) => void;

  // Onboarding status
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (status: boolean) => void;
}

// Navigation types for story creation flow
export type StoryCreationStep = 
  | 'universe-select'
  | 'start-select'
  | 'paragraph'
  | 'generating'
  | 'page';
