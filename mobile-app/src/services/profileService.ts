import type { SupabaseProfile } from '@/types';
import { supabase } from './supabase';

/** Result of ensureProfile: row created/updated or error. */
export type EnsureProfileResult =
  | { error: null; profile: SupabaseProfile }
  | { error: Error; profile: null };

/** Ensure a profile row exists (creates if missing). Returns the row so we don't depend on fetchProfile right after. */
export async function ensureProfile(
  userId: string,
  email: string | null,
  provider: 'email' | 'google' | 'apple' = 'email'
): Promise<EnsureProfileResult> {
  const payload = { id: userId, email: email ?? null, provider, updated_at: new Date().toISOString() };
  if (__DEV__) console.log('ensureProfile: upserting to Supabase profiles', { userId, email: payload.email, provider });
  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id', ignoreDuplicates: false })
    .select()
    .single();

  if (error) {
    if (__DEV__) console.log('ensureProfile: upsert failed', error.message, error.code);
    return { error: error as Error, profile: null };
  }
  if (!data) {
    if (__DEV__) console.log('ensureProfile: no row returned after upsert (check RLS)');
    return { error: new Error('No profile data'), profile: null };
  }
  if (__DEV__) console.log('ensureProfile: upsert ok', data.id);
  const profile = normalizeProfileRow(data);
  return { error: null, profile };
}

/** Normalize raw row to SupabaseProfile (handles missing columns from optional migrations). */
function normalizeProfileRow(row: Record<string, unknown>): SupabaseProfile {
  return {
    id: row.id as string,
    email: (row.email as string | null) ?? null,
    username: (row.username as string | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    stars_balance: Number(row.stars_balance) ?? 0,
    created_at: (row.created_at as string) ?? '',
    updated_at: (row.updated_at as string) ?? '',
    last_login_at: (row.last_login_at as string | null) ?? null,
    provider: (row.provider as 'email' | 'google' | 'apple') ?? 'email',
    is_child_account: Boolean(row.is_child_account),
    selected_avatar_id: (row.selected_avatar_id as string | null) ?? null,
    last_universe_id: (row.last_universe_id as string | null) ?? null,
    age: (row.age as number | null) ?? null,
    gender: (row.gender as 'boy' | 'girl' | null) ?? null,
    unlocked_universe_ids: Array.isArray(row.unlocked_universe_ids) ? row.unlocked_universe_ids : [],
  };
}

/** Fetch profile by user id. Uses select('*') so missing columns (e.g. 004) don't break the query. */
export async function fetchProfile(userId: string): Promise<SupabaseProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    if (__DEV__ && error) console.log('fetchProfile error:', error.message);
    return null;
  }
  return normalizeProfileRow(data as Record<string, unknown>);
}

/** Profile fields that can be updated by the user (RLS). */
export type ProfileUpdatePayload = Partial<
  Pick<
    SupabaseProfile,
    | 'username'
    | 'avatar_url'
    | 'stars_balance'
    | 'last_login_at'
    | 'is_child_account'
    | 'selected_avatar_id'
    | 'last_universe_id'
    | 'age'
    | 'gender'
    | 'unlocked_universe_ids'
  >
>;

/** Update profile. Only updates provided fields. RLS ensures user can only update own row. */
export async function updateProfile(
  userId: string,
  updates: ProfileUpdatePayload
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
  return { error: error ?? null };
}

/** Sync local store data to profile (call when user first creates account). Persists base fields first, then optional 004 fields. */
export async function syncLocalToProfile(
  userId: string,
  local: {
    username: string | null;
    selected_avatar_id: string | null;
    age: number | null;
    gender: 'boy' | 'girl' | null;
    unlocked_universe_ids: string[];
    stars_balance: number;
  }
): Promise<{ error: Error | null }> {
  const baseError = await updateProfile(userId, {
    username: local.username ?? null,
    selected_avatar_id: local.selected_avatar_id ?? null,
    stars_balance: Math.max(0, local.stars_balance),
  });
  if (baseError.error) return baseError;
  await updateProfile(userId, {
    age: local.age ?? null,
    gender: local.gender ?? null,
    unlocked_universe_ids: local.unlocked_universe_ids ?? [],
  });
  return { error: null };
}

/** Update last_login_at for the user (call after successful sign-in). */
export async function touchLastLogin(userId: string): Promise<void> {
  await updateProfile(userId, { last_login_at: new Date().toISOString() });
}

/** Sync stars balance to server. Call after local star changes to persist. */
export async function syncStarsToServer(userId: string, starsBalance: number): Promise<{ error: Error | null }> {
  return updateProfile(userId, { stars_balance: Math.max(0, starsBalance) });
}
