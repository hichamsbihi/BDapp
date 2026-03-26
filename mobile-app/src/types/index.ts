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
  /** Narrative step (order in path) */
  step?: number | null;
  // The choice that led to this page (if any)
  choiceId?: string;
}

// Narrative choice for story branching
export interface NarrativeChoice {
  id: string;
  text: string;
  /** Id of the paragraph shown after this choice (branching: different text + image) */
  nextParagraphId?: string | null;
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
export type RewardStarType = 'watch_ad' | 'countdown_bonus';

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
  setStories: (stories: Story[]) => void;
  removeStory: (storyId: string) => void;
  updateStory: (storyId: string, updates: Partial<Story>) => void;

  // Stars (narrative currency - non-monetary)
  stars: number;
  unlockedUniverses: string[];
  /** Last time user claimed the 12h countdown reward (ISO string) */
  lastCountdownClaimDate: string | null;
  addStars: (amount: number) => void;
  /** Set stars from server (e.g. on session restore). Use instead of addStars for sync. */
  setStarsFromServer: (amount: number) => void;
  /** Set unlocked universes from server (e.g. on login). */
  setUnlockedUniverses: (ids: string[]) => void;
  /** Add one universe to unlocked (e.g. after completing a story) without spending stars. */
  addUnlockedUniverse: (universeId: string) => void;
  spendStars: (amount: number) => boolean;
  canAfford: (amount: number) => boolean;
  rewardStar: (type: RewardStarType) => Promise<number>;
  unlockUniverse: (universeId: string) => boolean;

  // Premium status
  isPremium: boolean;
  setIsPremium: (status: boolean) => void;

  // Purchase tracking (for first-purchase promo)
  hasEverPurchased: boolean;
  setHasEverPurchased: (value: boolean) => void;

  // Onboarding status
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (status: boolean) => void;

  // Story progress from server (for "Continue in X")
  storyProgressList: { universeId: string; currentPageNumber: number }[];
  setStoryProgressList: (list: { universeId: string; currentPageNumber: number }[]) => void;

  /** Clear all persisted user data (e.g. on sign out or when server unreachable). Next launch will show onboarding. */
  resetStoreForSignOut: () => void;
}

/** Supabase profiles table row (extends auth.users). Avatar = selected_avatar_id (FK avatars), not avatar_url. */
export interface SupabaseProfile {
  id: string;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  stars_balance: number;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  provider: 'email' | 'google' | 'apple';
  is_child_account: boolean;
  selected_avatar_id: string | null;
  last_universe_id: string | null;
  age: number | null;
  gender: 'boy' | 'girl' | null;
  unlocked_universe_ids: string[];
  is_premium: boolean;
}

// Navigation types for story creation flow
export type StoryCreationStep = 
  | 'universe-select'
  | 'start-select'
  | 'paragraph'
  | 'generating'
  | 'page';
