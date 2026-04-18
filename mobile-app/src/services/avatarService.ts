import { supabase } from './supabase';
import { AvatarCharacter, AvatarFrames, FrameType } from '@/types';
import { getMockAvatars, getMockAvatarByName, getMockAvatarById } from '@/mocks/storyMock';

const USE_MOCK = true;

interface AvatarRow {
  id: string;
  character_name: string;
  frame_type: FrameType;
  image_url: string;
  storage_path: string;
  gender: 'boy' | 'girl' | 'all';
  display_order: number;
}

/**
 * Groups flat Supabase rows into AvatarCharacter objects.
 * Each character_name becomes one AvatarCharacter with a frames map.
 */
export const groupAvatarRows = (rows: AvatarRow[]): AvatarCharacter[] => {
  const characterMap = new Map<
    string,
    { id: string; gender: AvatarRow['gender']; displayOrder: number; frames: Partial<AvatarFrames> }
  >();

  for (const row of rows) {
    const existing = characterMap.get(row.character_name);

    if (existing) {
      existing.frames[row.frame_type] = row.image_url;
    } else {
      characterMap.set(row.character_name, {
        // Use the first row's id as the character id
        id: row.id,
        gender: row.gender,
        displayOrder: row.display_order,
        frames: { [row.frame_type]: row.image_url },
      });
    }
  }

  return [...characterMap.entries()]
    .map(([characterName, data]) => ({
      id: data.id,
      characterName,
      frames: data.frames as AvatarFrames,
      gender: data.gender,
      displayOrder: data.displayOrder,
    }))
    .sort((a, b) => a.displayOrder - b.displayOrder);
};

/**
 * Fetch all avatar characters, optionally filtered by gender.
 * Includes rows with gender='all' regardless of filter.
 */
export const fetchAvatarCharacters = async (
  gender?: 'boy' | 'girl'
): Promise<AvatarCharacter[]> => {
  if (USE_MOCK) return getMockAvatars(gender);

  let query = supabase
    .from('avatars')
    .select('*')
    .order('display_order', { ascending: true });

  if (gender) {
    query = query.in('gender', [gender, 'all']);
  }
  const { data, error } = await query;

  if (error) throw error;

  return groupAvatarRows((data ?? []) as AvatarRow[]);
};

/**
 * Fetch a single avatar character by character_name.
 */
export const fetchAvatarByName = async (
  characterName: string
): Promise<AvatarCharacter | null> => {
  if (USE_MOCK) return getMockAvatarByName(characterName);

  const { data, error } = await supabase
    .from('avatars')
    .select('*')
    .eq('character_name', characterName)
    .order('display_order', { ascending: true });

  if (error) throw error;
  if (!data?.length) return null;

  const grouped = groupAvatarRows(data as AvatarRow[]);
  return grouped[0] ?? null;
};

/** Fetch avatar by id (e.g. profile.selected_avatar_id). Returns character name and image URL for display. */
export async function fetchAvatarById(
  avatarId: string
): Promise<{ id: string; characterName: string; imageUrl: string } | null> {
  if (USE_MOCK) return getMockAvatarById(avatarId);

  const { data, error } = await supabase
    .from('avatars')
    .select('id, character_name, image_url')
    .eq('id', avatarId)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    characterName: (data as { character_name: string }).character_name,
    imageUrl: (data as { image_url: string }).image_url,
  };
}
