import { supabase } from './supabase';
import { NarrativeChoice, StoryStart, Universe, UniverseConfig, GeneratedStory, StoryPart, StoryChoice } from '@/types';

// ─── DB row types ────────────────────────────────────────

interface UniverseRow {
  id: string;
  name: string;
  description: string;
  image_url: string;
  background_image_url: string;
  color: string;
  language: string;
  emoji: string;
  gender: 'boy' | 'girl';
  display_order: number;
}

interface StoryRow {
  id: string;
  universe_id: string;
  title: string;
  synopsis: string;
  theme: string;
  image_url: string;
  credits_required: number;
  total_parts: number;
  status: string;
  created_at: string;
  completed_at: string | null;
}

interface StoryPartRow {
  id: string;
  story_id: string;
  universe_id: string;
  part_number: number;
  is_opening: boolean;
  is_ending: boolean;
  title: string;
  narrative_text: string;
  mood: string;
  choices: unknown;
  image_prompt: string;
  image_path: string;
  image_url: string | null;
  status: string;
  generated_at: string;
}

interface StoryStartRow {
  id: string;
  universe_id: string;
  title: string;
  text: string;
  first_page_id?: string | null;
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

// ─── Mappers ─────────────────────────────────────────────

const toUniverseConfig = (row: UniverseRow): UniverseConfig => ({
  id: row.id,
  name: row.name,
  description: row.description,
  imageUrl: row.image_url,
  backgroundImageUrl: row.background_image_url,
  color: row.color,
  language: row.language,
  emoji: row.emoji,
  isLocked: false,
  gender: row.gender,
});

const toGeneratedStory = (row: StoryRow): GeneratedStory => ({
  id: row.id,
  universeId: row.universe_id,
  title: row.title,
  synopsis: row.synopsis,
  theme: row.theme,
  imageUrl: row.image_url,
  creditsRequired: row.credits_required,
  totalParts: row.total_parts,
  status: row.status,
  createdAt: row.created_at,
  completedAt: row.completed_at ?? undefined,
});

const toStoryPart = (row: StoryPartRow): StoryPart => {
  const rawChoices = Array.isArray(row.choices) ? row.choices : [];
  const choices: StoryChoice[] = rawChoices.map((c: any) => ({
    id: c.id,
    label: c.label,
    description: c.description,
    leadsToPartId: c.leadsToPartId,
  }));
  return {
    id: row.id,
    storyId: row.story_id,
    universeId: row.universe_id,
    partNumber: row.part_number,
    isOpening: row.is_opening,
    isEnding: row.is_ending,
    title: row.title,
    narrativeText: row.narrative_text,
    mood: row.mood,
    choices,
    imagePrompt: row.image_prompt,
    imagePath: row.image_path,
    imageUrl: row.image_url ?? undefined,
    status: row.status,
    generatedAt: row.generated_at,
  };
};

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

// ─── Queries ─────────────────────────────────────────────

export const fetchUniversesByGender = async (
  gender: 'boy' | 'girl'
): Promise<UniverseConfig[]> => {
  const { data, error } = await supabase
    .from('universes')
    .select('*')
    .eq('gender', gender)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(toUniverseConfig);
};

export const fetchUniverseById = async (
  universeId: string
): Promise<Universe | null> => {
  const { data, error } = await supabase
    .from('universes')
    .select('*')
    .eq('id', universeId)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    imageUrl: data.image_url,
    backgroundImageUrl: data.background_image_url,
    color: data.color,
    language: data.language,
  };
};

export const fetchStoriesForUniverse = async (
  universeId: string
): Promise<GeneratedStory[]> => {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('universe_id', universeId)
    .eq('status', 'complete')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toGeneratedStory);
};

export const fetchPartsForStory = async (
  storyId: string
): Promise<StoryPart[]> => {
  const { data, error } = await supabase
    .from('story_parts')
    .select('*')
    .eq('story_id', storyId)
    .order('part_number', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(toStoryPart);
};

// ─── Legacy queries (story_starts, story_paragraphs, narrative_choices) ──

export const fetchStoryStarts = async (
  universeId: string
): Promise<StoryStart[]> => {
  const { data, error } = await supabase
    .from('story_starts')
    .select('*')
    .eq('universe_id', universeId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const seen = new Set<string>();
  const latest = (data ?? []).filter((row: any) => {
    const key = row.path_id ?? row.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  latest.sort((a: any, b: any) =>
    (a.path_id ?? a.id).localeCompare(b.path_id ?? b.id)
  );

  return latest.map(toStoryStart);
};

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
