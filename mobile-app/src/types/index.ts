// Hero profile types
export interface HeroProfile {
  id: string;
  name: string;
  age: number;
  gender: 'boy' | 'girl';
  avatarId: string;
  /** Avatar image URL (normal frame) for display on completed story, etc. */
  avatarImageUrl?: string;
  /** Avatar character name for display (e.g. "Léo", "Mia") */
  avatarCharacterName?: string;
}

// Avatar types (legacy - used by store for selected avatar reference)
export interface Avatar {
  id: string;
  name: string;
  imageUrl: string;
  color?: string;
}

// Frame-based avatar system (Supabase avatars table)
export type FrameType = 'normal' | 'blink' | 'wink' | 'happy';

export interface AvatarFrames {
  normal: string;
  blink?: string;
  wink?: string;
  happy?: string;
}

export interface AvatarCharacter {
  id: string;
  characterName: string;
  frames: AvatarFrames;
  gender: 'boy' | 'girl' | 'all';
  displayOrder: number;
}

// Universe types
export interface Universe {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  color: string;
}

// Extended universe with client-side display properties
export interface UniverseConfig extends Universe {
  isLocked: boolean;
  emoji: string;
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
  // The choice that led to this page (if any)
  choiceId?: string;
}

// Narrative choice for story branching
export interface NarrativeChoice {
  id: string;
  text: string;
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
  // Opening story data (selected start)
  startId?: string;
  openingText?: string;
  // Current narrative choices available
  nextChoices?: NarrativeChoice[];
  // Selected choice for the next page
  selectedChoiceId?: string;
}

// Stars reward types (non-monetary, narrative)
export type RewardStarType = 'watch_ad' | 'story_complete' | 'daily_bonus';

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

  // Stars (narrative currency - non-monetary)
  stars: number;
  unlockedUniverses: string[];
  lastDailyBonusDate: string | null;
  addStars: (amount: number) => void;
  spendStars: (amount: number) => boolean;
  canAfford: (amount: number) => boolean;
  rewardStar: (type: RewardStarType) => Promise<number>;
  unlockUniverse: (universeId: string) => boolean;

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
