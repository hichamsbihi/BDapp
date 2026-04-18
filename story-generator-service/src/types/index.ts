// ============================================================
// CORE DOMAIN TYPES
// ============================================================

export type StoryTheme = "fantasy" | "sci-fi" | "noir" | "horror" | "adventure" | "romance" | string;
export type PartStatus = "generated" | "pending" | "error";
export type StoryStatus = "generating" | "complete" | "error";

// ============================================================
// CHOICE — embedded in Part
// ============================================================

export interface Choice {
  id: string;           // e.g. "choice_a", "choice_b"
  label: string;        // Short label shown to user: "Follow the stranger"
  description: string;  // One-sentence consequence hint
  leadsToPartId: string; // ID of the Part this choice navigates to
}

// ============================================================
// PART MODEL — Supabase collection: "parts"
// ============================================================

export interface Part {
  id: string;                  // UUID — also used as image filename
  storyId: string;             // FK → Story.id
  universeId: string;          // FK → Universe.id (denormalized for queries)
  partNumber: number;          // 1-based index in the story
  isOpening: boolean;          // true only for partNumber === 1
  isEnding: boolean;           // true if this part is a terminal leaf

  // Narrative content
  title: string;               // Short evocative title for the part
  narrativeText: string;       // Full story prose for this part
  mood: string;                // e.g. "tense", "hopeful", "melancholic"

  // Choices (always 2 for non-ending parts, empty [] for endings)
  choices: Choice[];

  // Image
  imagePrompt: string;         // Prompt sent to Flux Schnell
  imagePath: string;           // Relative path: images/{universeId}/{storyId}/{partId}.png
  imageUrl?: string;           // Optional public URL if stored in Supabase Storage

  // Metadata
  status: PartStatus;
  generatedAt: string;         // ISO timestamp
}

// ============================================================
// STORY MODEL — Supabase collection: "stories"
// ============================================================

export interface Story {
  id: string;                  // UUID
  universeId: string;          // FK → Universe.id
  title: string;               // AI-generated story title
  synopsis: string;            // 2-3 sentence summary of the overall arc
  theme: StoryTheme;
  totalParts: number;          // Requested number of parts
  parts: Part[];               // Full parts array (denormalized for local output)
  partIds: string[];           // Ordered list of Part IDs (for Supabase relational use)

  // Character snapshot (copy from Universe for portability)
  mainCharacter: Character;

  // Status
  status: StoryStatus;
  createdAt: string;           // ISO timestamp
  completedAt?: string;        // ISO timestamp when generation finished
}

// ============================================================
// CHARACTER — embedded in Universe + copied into Story
// ============================================================

export interface Character {
  name: string;
  age?: number;
  gender?: string;
  appearance: string;          // Visual description for image prompts
  personality: string;         // Traits that shape narrative tone
  backstory: string;           // Origin/motivation summary
  skills: string[];            // e.g. ["hacking", "stealth", "persuasion"]
  flaws: string[];             // e.g. ["impulsive", "distrustful"]
}

// ============================================================
// UNIVERSE MODEL — Supabase collection: "universes"
// ============================================================

export interface Universe {
  id: string;                  // UUID — used in image directory path
  name: string;                // e.g. "The Shattered Dominion"
  description: string;         // Full world description provided by user
  theme: StoryTheme;
  setting: string;             // Era/place summary: "post-apocalyptic Tokyo, 2147"
  tone: string;                // "dark and gritty" | "whimsical" | etc.
  lore: string;                // Key world rules, factions, magic systems, etc.
  mainCharacter: Character;

  // Visual style for image generation consistency
  visualStyle: string;         // e.g. "cyberpunk neon, rain-soaked streets, cinematic"

  // Stories in this universe
  storyIds: string[];

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// API INPUT / OUTPUT TYPES
// ============================================================

/** Input from CLI or programmatic call */
export interface GenerationInput {
  universeDescription: string;
  characterDescription: string;
  numberOfParts: number;
  theme?: StoryTheme;
  universeName?: string;
  storyTitle?: string;
}

/** Raw JSON returned by Claude for each part */
export interface ClaudePartResponse {
  partNumber: number;
  title: string;
  narrativeText: string;
  mood: string;
  isEnding: boolean;
  imagePrompt: string;
  choices: Array<{
    id: string;
    label: string;
    description: string;
  }>;
}

/** Raw JSON returned by Claude for story initialization */
export interface ClaudeStoryInitResponse {
  storyTitle: string;
  synopsis: string;
  universe: {
    name: string;
    setting: string;
    tone: string;
    lore: string;
    visualStyle: string;
  };
  character: Character;
}

/** Full generation result returned to caller */
export interface GenerationResult {
  universe: Universe;
  story: Story;
  outputJsonPath: string;
}

// ============================================================
// SUPABASE DOCUMENT SCHEMAS
// (These match the exact shape stored in each NoSQL document)
// ============================================================

/** Stored in "universes" table — document shape */
export interface UniverseDocument extends Omit<Universe, "storyIds"> {
  storyIds: string[];  // Array of story UUIDs
}

/** Stored in "stories" table — document shape */
export interface StoryDocument extends Omit<Story, "parts"> {
  // Note: full parts array NOT stored here — parts live in their own collection
  // partIds is the reference array
}

/** Stored in "parts" table — document shape */
export interface PartDocument extends Part {
  // Part is stored as-is
}
