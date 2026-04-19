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
  imageHappy?: string;
  imageSmiling?: string;
  gender: 'boy' | 'girl' | 'all';
  displayOrder: number;
}

// Universe types
export interface Universe {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  backgroundImageUrl: string;
  color: string;
  language: string;
}

// Extended universe with client-side display properties
export interface UniverseConfig extends Universe {
  isLocked: boolean;
  emoji: string;
  gender: 'boy' | 'girl';
}

// Story types
export interface StoryStart {
  id: string;
  universeId: string;
  title: string;
  text: string;
  /** Links to the first page_id when user picks this start (branching intro) */
  firstPageId?: string | null;
  /**
   * Narrative path label from n8n (e.g. "start-A", "start-B").
   * Used for ordering: sort ascending → index 0 = path A = DB page_number 1.
   * Stable across multiple story generations for the same universe.
   */
  pathId?: string;
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
  /** DB page_number to navigate to after this choice (primary navigation driver) */
  nextPageNumber?: number | null;
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
  /**
   * Actual page_number in story_paragraphs for the current screen.
   * Replaces `pages.length + 1` which breaks on non-sequential branching paths
   * (e.g. page 1 → choice → page 3, not page 2).
   */
  currentDbPageNumber?: number;
  // Current narrative choices available
  nextChoices?: NarrativeChoice[];
  // Selected choice for the next page
  selectedChoiceId?: string;

  // Story generator model fields
  generatedStoryId?: string;
  currentPartId?: string;
  allParts?: StoryPart[];
  synopsis?: string;
}

// Credit reward types (narrative currency)
export type RewardType = 'watch_ad';

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

  // Credits (narrative currency)
  credits: number;
  unlockedStories: string[];
  addCredits: (amount: number) => void;
  setCreditsFromServer: (amount: number) => void;
  setUnlockedStories: (ids: string[]) => void;
  addUnlockedStory: (storyId: string) => void;
  spendCredits: (amount: number) => boolean;
  canAfford: (amount: number) => boolean;
  rewardCredits: (type: RewardType) => Promise<number>;
  unlockStory: (storyId: string, cost: number) => boolean;

  // Premium status (unlimited access)
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

  resetStoreForSignOut: () => void;
}

/** Supabase profiles table row (extends auth.users). */
export interface SupabaseProfile {
  id: string;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  provider: 'anonymous' | 'email' | 'google' | 'apple';
  is_child_account: boolean;
  selected_avatar_id: string | null;
  last_universe_id: string | null;
  age: number | null;
  gender: 'boy' | 'girl' | null;
  is_premium: boolean;
}

/** Supabase wallets table row. */
export interface Wallet {
  id: string;
  user_id: string;
  credits: number;
  unlimited: boolean;
  unlimited_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Story Generator Service model ─────────────────────

export interface StoryChoice {
  id: string;
  label: string;
  description: string;
  leadsToPartId: string;
}

export interface StoryPart {
  id: string;
  storyId: string;
  universeId: string;
  partNumber: number;
  isOpening: boolean;
  isEnding: boolean;
  title: string;
  narrativeText: string;
  mood: string;
  choices: StoryChoice[];
  imagePrompt: string;
  imagePath: string;
  imageUrl?: string;
  status: string;
  generatedAt: string;
}

export interface GeneratedStory {
  id: string;
  universeId: string;
  title: string;
  synopsis: string;
  theme: string;
  imageUrl: string;
  creditsRequired: number;
  totalParts: number;
  status: string;
  createdAt: string;
  completedAt?: string;
}

// Navigation types for story creation flow
export type StoryCreationStep = 
  | 'universe-select'
  | 'start-select'
  | 'paragraph'
  | 'generating'
  | 'page';
