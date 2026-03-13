/**
 * Syncs app store with Supabase when user is connected.
 * Call from store subscription or after store mutations.
 */

import type { Story, StoryPage } from '@/types';
import { getCurrentUser } from './authService';
import { updateProfile } from './profileService';
import { supabase } from './supabase';

export interface StoryProgressRow {
  user_id: string;
  universe_id: string;
  current_page_number: number;
  updated_at?: string;
}

/** Sync stars to profile. Call after any stars change when user is logged in. */
export async function syncStars(starsBalance: number): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await updateProfile(user.id, { stars_balance: Math.max(0, starsBalance) });
}

/** Sync hero profile + unlocked universes + is_premium to profile. Call when store changes. */
export async function syncProfileFromStore(payload: {
  username: string | null;
  selected_avatar_id: string | null;
  age: number | null;
  gender: 'boy' | 'girl' | null;
  unlocked_universe_ids: string[];
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
    unlocked_universe_ids: payload.unlocked_universe_ids ?? [],
    ...(payload.last_universe_id !== undefined && { last_universe_id: payload.last_universe_id }),
    ...(payload.is_premium !== undefined && { is_premium: payload.is_premium }),
  });
}

/** Upsert story progress (user_id, universe_id, current_page_number). Use when user advances or starts a story. */
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
  if (__DEV__ && error) console.log('upsertStoryProgress error:', error.message);
}

/** Record a narrative choice (for replay / resume). */
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
  if (__DEV__ && error) console.log('insertUserChoice error:', error.message);
}

/** Fetch all story progress for user (for "Continue in X" and resume). */
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

/** Update profile last_universe_id (e.g. when user starts or resumes a story). */
export async function setLastUniverse(userId: string, universeId: string): Promise<void> {
  await updateProfile(userId, { last_universe_id: universeId });
}

/** Row shape from user_created_stories (snake_case). */
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

/** Persist a completed story to the DB (when user is connected). Uses story.id as story_client_id for upsert. */
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
  if (__DEV__ && error) console.log('saveCreatedStory error:', error.message);
}

/** Fetch all created (completed) stories for the user from the DB. Maps to Story[]. */
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
