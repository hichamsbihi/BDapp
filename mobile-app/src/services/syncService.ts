import type { Story, StoryPage } from '@/types';
import { getCurrentUser } from './authService';
import { updateProfile } from './profileService';
import { syncCreditsToServer, unlockStoryOnServer } from './walletService';
import { supabase } from './supabase';

export interface StoryProgressRow {
  user_id: string;
  universe_id: string;
  current_page_number: number;
  updated_at?: string;
}

export async function syncCredits(credits: number): Promise<void> {
  await syncCreditsToServer(credits);
}

export async function syncProfileFromStore(payload: {
  username: string | null;
  selected_avatar_id: string | null;
  age: number | null;
  gender: 'boy' | 'girl' | null;
  last_universe_id?: string | null;
  is_premium?: boolean;
}): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await updateProfile(user.id, {
    username: payload.username ?? null,
    selected_avatar_id: payload.selected_avatar_id ?? null,
    age: payload.age ?? null,
    gender: payload.gender ?? null,
    ...(payload.last_universe_id !== undefined && { last_universe_id: payload.last_universe_id }),
    ...(payload.is_premium !== undefined && { is_premium: payload.is_premium }),
  });
}

export async function syncUnlockedStories(storyIds: string[]): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  for (const storyId of storyIds) {
    await unlockStoryOnServer(storyId);
  }
}

export async function upsertStoryProgress(
  userId: string,
  universeId: string,
  currentPageNumber: number
): Promise<void> {
  const { error } = await supabase.from('user_story_progress').upsert(
    {
      user_id: userId,
      universe_id: universeId,
      current_page_number: Math.max(1, currentPageNumber),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,universe_id' }
  );
  if (error && __DEV__) console.log('upsertStoryProgress error:', error.message);
}

export async function insertUserChoice(
  userId: string,
  universeId: string,
  pageNumber: number,
  choiceId: string
): Promise<void> {
  const { error } = await supabase.from('user_choices').insert({
    user_id: userId,
    universe_id: universeId,
    page_number: pageNumber,
    choice_id: choiceId,
  });
  if (error && __DEV__) console.log('insertUserChoice error:', error.message);
}

export async function fetchUserStoryProgress(
  userId: string
): Promise<StoryProgressRow[]> {
  const { data, error } = await supabase
    .from('user_story_progress')
    .select('user_id, universe_id, current_page_number, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as StoryProgressRow[];
}

export async function setLastUniverse(userId: string, universeId: string): Promise<void> {
  await updateProfile(userId, { last_universe_id: universeId });
}

interface UserCreatedStoryRow {
  id: string;
  user_id: string;
  story_client_id: string;
  universe_id: string;
  title: string;
  hero_id: string | null;
  pages: unknown;
  start_id: string | null;
  opening_text: string | null;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export async function saveCreatedStory(userId: string, story: Story): Promise<void> {
  const pages = (story.pages ?? []) as StoryPage[];
  const { error } = await supabase.from('user_created_stories').upsert(
    {
      user_id: userId,
      story_client_id: story.id,
      universe_id: story.universeId,
      title: story.title ?? 'Sans titre',
      hero_id: story.heroId ?? null,
      pages: pages.map((p) => ({
        id: p.id,
        paragraphText: p.paragraphText,
        imageUrl: p.imageUrl,
        pageNumber: p.pageNumber,
        choiceId: p.choiceId,
      })),
      start_id: story.startId ?? null,
      opening_text: story.openingText ?? null,
      is_complete: story.isComplete !== false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,story_client_id' }
  );
  if (error && __DEV__) console.log('saveCreatedStory error:', error.message);
}

export async function fetchUserCreatedStories(userId: string): Promise<Story[]> {
  const { data, error } = await supabase
    .from('user_created_stories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  const rows = (data ?? []) as UserCreatedStoryRow[];
  return rows.map((row) => {
    const pages = Array.isArray(row.pages) ? row.pages as StoryPage[] : [];
    return {
      id: row.story_client_id,
      title: row.title,
      universeId: row.universe_id,
      heroId: row.hero_id ?? '',
      pages,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      isComplete: row.is_complete,
      startId: row.start_id ?? undefined,
      openingText: row.opening_text ?? undefined,
    } as Story;
  });
}
