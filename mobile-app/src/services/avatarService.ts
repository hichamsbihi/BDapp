import { supabase } from './supabase';
import { AvatarCharacter, AvatarFrames } from '@/types';

const SUPABASE_ASSETS = 'https://wddatxgqhdiosuhcztex.supabase.co/storage/v1/object/public/assets/avatars';

interface AvatarRow {
  id: string;
  character_name: string;
  gender: 'boy' | 'girl' | 'all';
  frame_slug: string;
  image_happy: string | null;
  image_smiling: string | null;
  display_order: number;
}

const toAvatarCharacter = (row: AvatarRow): AvatarCharacter => ({
  id: row.id,
  characterName: row.character_name,
  frames: {
    normal: `${SUPABASE_ASSETS}/${row.frame_slug}-normal.png`,
    happy: `${SUPABASE_ASSETS}/${row.frame_slug}-happy.png`,
  },
  imageHappy: row.image_happy ?? undefined,
  imageSmiling: row.image_smiling ?? undefined,
  gender: row.gender,
  displayOrder: row.display_order,
});

export const fetchAvatarCharacters = async (
  gender?: 'boy' | 'girl'
): Promise<AvatarCharacter[]> => {
  let query = supabase
    .from('avatars')
    .select('*')
    .order('display_order', { ascending: true });

  if (gender) {
    query = query.in('gender', [gender, 'all']);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row: any) => toAvatarCharacter(row));
};

export const fetchAvatarByName = async (
  characterName: string
): Promise<AvatarCharacter | null> => {
  const { data, error } = await supabase
    .from('avatars')
    .select('*')
    .eq('character_name', characterName)
    .single();

  if (error || !data) return null;
  return toAvatarCharacter(data as any);
};

export async function fetchAvatarById(
  avatarId: string
): Promise<{ id: string; characterName: string; imageUrl: string } | null> {
  const { data, error } = await supabase
    .from('avatars')
    .select('*')
    .eq('id', avatarId)
    .single();

  if (error || !data) return null;
  const avatar = toAvatarCharacter(data as any);
  return {
    id: avatar.id,
    characterName: avatar.characterName,
    imageUrl: avatar.frames.normal,
  };
}
