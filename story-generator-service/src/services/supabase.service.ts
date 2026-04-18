import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  Universe,
  Story,
  Part,
  UniverseDocument,
  StoryDocument,
  PartDocument,
} from "../types";

// ─────────────────────────────────────────────
// Supabase NoSQL collections (tables used as document stores)
// ─────────────────────────────────────────────
const TABLES = {
  UNIVERSES: "universes",
  STORIES: "stories",
  PARTS: "parts",
} as const;

export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment"
      );
    }
    this.client = createClient(url, key);
  }

  // ─────────────────────────────────────────────
  // UNIVERSE — upsert (create or update)
  // ─────────────────────────────────────────────
  async saveUniverse(universe: Universe): Promise<void> {
    const doc: UniverseDocument = {
      ...universe,
      storyIds: universe.storyIds,
    };

    const { error } = await this.client
      .from(TABLES.UNIVERSES)
      .upsert(doc, { onConflict: "id" });

    if (error) throw new Error(`Failed to save universe: ${error.message}`);
    console.log(`  📦 Universe saved to Supabase: ${universe.id}`);
  }

  // ─────────────────────────────────────────────
  // UNIVERSE — fetch by ID
  // ─────────────────────────────────────────────
  async getUniverse(universeId: string): Promise<Universe | null> {
    const { data, error } = await this.client
      .from(TABLES.UNIVERSES)
      .select("*")
      .eq("id", universeId)
      .single();

    if (error) return null;
    return data as Universe;
  }

  // ─────────────────────────────────────────────
  // STORY — upsert (without embedded parts array)
  // ─────────────────────────────────────────────
  async saveStory(story: Story): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { parts: _parts, ...storyWithoutParts } = story;

    const doc: StoryDocument = {
      ...storyWithoutParts,
    };

    const { error } = await this.client
      .from(TABLES.STORIES)
      .upsert(doc, { onConflict: "id" });

    if (error) throw new Error(`Failed to save story: ${error.message}`);
    console.log(`  📖 Story saved to Supabase: ${story.id}`);
  }

  // ─────────────────────────────────────────────
  // STORY — fetch by ID (without parts)
  // ─────────────────────────────────────────────
  async getStory(storyId: string): Promise<StoryDocument | null> {
    const { data, error } = await this.client
      .from(TABLES.STORIES)
      .select("*")
      .eq("id", storyId)
      .single();

    if (error) return null;
    return data as StoryDocument;
  }

  // ─────────────────────────────────────────────
  // STORY — fetch full story with all its parts
  // ─────────────────────────────────────────────
  async getStoryWithParts(storyId: string): Promise<Story | null> {
    const storyDoc = await this.getStory(storyId);
    if (!storyDoc) return null;

    const parts = await this.getPartsByStory(storyId);

    return {
      ...storyDoc,
      parts: parts.sort((a, b) => a.partNumber - b.partNumber),
    };
  }

  // ─────────────────────────────────────────────
  // PART — upsert single part
  // ─────────────────────────────────────────────
  async savePart(part: Part): Promise<void> {
    const doc: PartDocument = { ...part };

    const { error } = await this.client
      .from(TABLES.PARTS)
      .upsert(doc, { onConflict: "id" });

    if (error)
      throw new Error(
        `Failed to save part ${part.partNumber}: ${error.message}`
      );
  }

  // ─────────────────────────────────────────────
  // PARTS — bulk upsert all parts for a story
  // ─────────────────────────────────────────────
  async saveParts(parts: Part[]): Promise<void> {
    const docs: PartDocument[] = parts.map((p) => ({ ...p }));

    const { error } = await this.client
      .from(TABLES.PARTS)
      .upsert(docs, { onConflict: "id" });

    if (error) throw new Error(`Failed to bulk save parts: ${error.message}`);
    console.log(`  🧩 ${parts.length} parts saved to Supabase`);
  }

  // ─────────────────────────────────────────────
  // PARTS — fetch all parts for a story
  // ─────────────────────────────────────────────
  async getPartsByStory(storyId: string): Promise<Part[]> {
    const { data, error } = await this.client
      .from(TABLES.PARTS)
      .select("*")
      .eq("storyId", storyId)
      .order("partNumber", { ascending: true });

    if (error) throw new Error(`Failed to fetch parts: ${error.message}`);
    return (data ?? []) as Part[];
  }

  // ─────────────────────────────────────────────
  // FULL SAVE — save universe + story + all parts atomically
  // (Supabase NoSQL doesn't support true transactions across tables,
  //  so we save in dependency order and handle errors individually)
  // ─────────────────────────────────────────────
  async saveFullStory(universe: Universe, story: Story): Promise<void> {
    console.log("\n💾 Saving to Supabase...");

    // 1. Universe first (FK dependency)
    await this.saveUniverse(universe);

    // 2. Story document (without parts array)
    await this.saveStory(story);

    // 3. All parts
    await this.saveParts(story.parts);

    console.log("✅ Full story saved to Supabase successfully");
  }

  // ─────────────────────────────────────────────
  // UNIVERSE — update storyIds array after new story added
  // ─────────────────────────────────────────────
  async appendStoryToUniverse(
    universeId: string,
    storyId: string
  ): Promise<void> {
    const universe = await this.getUniverse(universeId);
    if (!universe) throw new Error(`Universe ${universeId} not found`);

    const updatedIds = [...new Set([...universe.storyIds, storyId])];

    const { error } = await this.client
      .from(TABLES.UNIVERSES)
      .update({ storyIds: updatedIds, updatedAt: new Date().toISOString() })
      .eq("id", universeId);

    if (error)
      throw new Error(`Failed to update universe storyIds: ${error.message}`);
  }
}
