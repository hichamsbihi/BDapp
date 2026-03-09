import { supabase } from './supabase';

export interface AppAsset {
  id: string;
  type: 'background' | 'avatar' | 'mascot' | 'decoration';
  name: string;
  description: string;
  imageUrl: string;
  universeType: string | null;
  gender: 'boy' | 'girl' | 'all';
  displayOrder: number;
}

interface AppAssetRow {
  id: string;
  type: string;
  name: string;
  description: string;
  image_url: string;
  universe_type: string | null;
  gender: string;
  display_order: number;
}

const toAppAsset = (row: AppAssetRow): AppAsset => ({
  id: row.id,
  type: row.type as AppAsset['type'],
  name: row.name,
  description: row.description,
  imageUrl: row.image_url,
  universeType: row.universe_type,
  gender: row.gender as AppAsset['gender'],
  displayOrder: row.display_order,
});

/**
 * Fetch universe backgrounds (for story reader fullscreen).
 */
export const fetchBackgrounds = async (): Promise<AppAsset[]> => {
  const { data, error } = await supabase
    .from('app_assets')
    .select('*')
    .eq('type', 'background')
    .order('display_order');

  if (error) throw error;
  return (data ?? []).map(toAppAsset);
};

/**
 * Fetch background for a specific universe type.
 */
export const fetchBackgroundByUniverse = async (
  universeType: string
): Promise<AppAsset | null> => {
  const { data, error } = await supabase
    .from('app_assets')
    .select('*')
    .eq('type', 'background')
    .eq('universe_type', universeType)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data ? toAppAsset(data) : null;
};

/**
 * Fetch avatars, optionally filtered by gender.
 */
export const fetchAvatars = async (
  gender?: 'boy' | 'girl'
): Promise<AppAsset[]> => {
  let query = supabase
    .from('app_assets')
    .select('*')
    .eq('type', 'avatar')
    .order('display_order');

  if (gender) {
    query = query.in('gender', [gender, 'all']);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toAppAsset);
};

/**
 * Fetch the app mascot.
 */
export const fetchMascot = async (): Promise<AppAsset | null> => {
  const { data, error } = await supabase
    .from('app_assets')
    .select('*')
    .eq('type', 'mascot')
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data ? toAppAsset(data) : null;
};

/**
 * Fetch decorative assets (frames, banners).
 */
export const fetchDecorations = async (): Promise<AppAsset[]> => {
  const { data, error } = await supabase
    .from('app_assets')
    .select('*')
    .eq('type', 'decoration')
    .order('display_order');

  if (error) throw error;
  return (data ?? []).map(toAppAsset);
};
