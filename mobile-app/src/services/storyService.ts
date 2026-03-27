import { supabase } from './supabase';
import { NarrativeChoice, StoryStart, Universe, UniverseConfig } from '@/types';

// Supabase row types (snake_case from DB)
interface UniverseRow {
  id: string;
  name: string;
  description: string;
  image_url: string;
  color: string;
  emoji: string;
  gender: 'boy' | 'girl';
  display_order: number;
  avatar_character_names: string[];
}

interface StoryStartRow {
  id: string;
  universe_id: string;
  title: string;
  text: string;
  first_page_id?: string | null;
  /** Narrative path label (e.g. "start-A", "start-B"). Used for ordering + page_number mapping. */
  path_id?: string | null;
}

interface NarrativeChoiceRow {
  id: string;
  universe_id: string;
  page_number: number;
  choice_order: number;
  text: string;
  next_paragraph_id?: string | null;
  next_page_number?: number | null;
}

// DB row to app model mappers
const toUniverseConfig = (row: UniverseRow): UniverseConfig => ({
  id: row.id,
  name: row.name,
  description: row.description,
  imageUrl: row.image_url,
  color: row.color,
  emoji: row.emoji,
  // isLocked is computed client-side via unlockedUniverses in Zustand store
  isLocked: true,
});

const toStoryStart = (row: StoryStartRow): StoryStart => ({
  id: row.id,
  universeId: row.universe_id,
  title: row.title,
  text: row.text,
  firstPageId: row.first_page_id ?? undefined,
  pathId: row.path_id ?? undefined,
});

const toNarrativeChoice = (row: NarrativeChoiceRow): NarrativeChoice => ({
  id: row.id,
  text: row.text,
  nextParagraphId: row.next_paragraph_id ?? undefined,
  nextPageNumber: row.next_page_number ?? undefined,
});

/**
 * Fetch universes linked to a specific avatar character.
 * Falls back to gender-based filtering when avatar has no character name
 * (e.g. during migration or if avatar_character_names is not yet populated).
 */
export const fetchUniversesByAvatar = async (
  avatarCharacterName: string | undefined,
  gender: 'boy' | 'girl'
): Promise<UniverseConfig[]> => {
  let query = supabase
    .from('universes')
    .select('*')
    .order('display_order', { ascending: true });

  if (avatarCharacterName) {
    query = query.contains('avatar_character_names', [avatarCharacterName]);
  } else {
    // Fallback for profiles without avatarCharacterName
    query = query.eq('gender', gender);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toUniverseConfig);
};

/**
 * Fetch a single universe by ID from Supabase.
 * Used by LibraryScreen to display universe name on story cards.
 */
export const fetchUniverseById = async (
  universeId: string
): Promise<Universe | null> => {
  const { data, error } = await supabase
    .from('universes')
    .select('*')
    .eq('id', universeId)
    .single();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    imageUrl: data.image_url,
    color: data.color,
  };
};

/**
 * Fetch story starts for a given universe from Supabase.
 *
 * With unique IDs, each n8n run inserts new rows for the same universe.
 * We sort by created_at DESC, then deduplicate client-side:
 * keep only the most-recent row per path_id (start-A, start-B, …).
 * Result: always 1 story start per narrative path, latest generation wins.
 *
 * Uses select('*') because path_id column may not exist yet (migration pending).
 */
export const fetchStoryStarts = async (
  universeId: string
): Promise<StoryStart[]> => {
  const { data, error } = await supabase
    .from('story_starts')
    .select('*')
    .eq('universe_id', universeId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Deduplicate: keep only the first (newest) row per path_id.
  // For legacy rows without path_id, fall back to id itself as the key.
  const seen = new Set<string>();
  const latest = (data ?? []).filter((row) => {
    const key = row.path_id ?? row.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by path_id ASC so index 0 = path A = page 1
  latest.sort((a, b) =>
    (a.path_id ?? a.id).localeCompare(b.path_id ?? b.id)
  );

  return latest.map(toStoryStart);
};

/**
 * Fetch paragraph text and optional image for a specific universe page.
 * If image_url is null in DB, returns a placeholder URL.
 */
export const fetchParagraphForPage = async (
  universeId: string,
  pageNumber: number
): Promise<{ text: string; imageUrl: string }> => {
  const { data, error } = await supabase
    .from('story_paragraphs')
    .select('text, image_url')
    .eq('universe_id', universeId)
    .eq('page_number', pageNumber)
    .single();

  if (error) throw error;

  const placeholderImage = `https://picsum.photos/seed/${universeId}-${pageNumber}/400/300`;

  return {
    text: data.text,
    imageUrl: data.image_url ?? placeholderImage,
  };
};

/**
 * Fetch narrative choices for a specific universe page.
 * Returns choices with nextParagraphId when set (branching: each choice leads to a specific next paragraph).
 */
export const fetchChoicesForPage = async (
  universeId: string,
  pageNumber: number
): Promise<NarrativeChoice[]> => {
  const { data, error } = await supabase
    .from('narrative_choices')
    .select('id, universe_id, page_number, choice_order, text, next_paragraph_id, next_page_number')
    .eq('universe_id', universeId)
    .eq('page_number', pageNumber)
    .order('choice_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(toNarrativeChoice);
};

/**
 * Fetch a single paragraph by id (for branching: next paragraph after a choice).
 * Use when nextParagraphId is set on the chosen choice.
 */
export const fetchParagraphById = async (
  paragraphId: string
): Promise<{ id: string; text: string; imageUrl: string; pageNumber: number; step?: number | null } | null> => {
  const { data, error } = await supabase
    .from('story_paragraphs')
    .select('id, text, image_url, page_number, step')
    .eq('id', paragraphId)
    .single();

  if (error || !data) return null;
  const placeholderImage = `https://picsum.photos/seed/${paragraphId}/400/300`;
  return {
    id: data.id,
    text: data.text,
    imageUrl: data.image_url ?? placeholderImage,
    pageNumber: data.page_number ?? 0,
    step: data.step ?? undefined,
  };
};
