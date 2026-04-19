import type { SupabaseProfile } from '@/types';
import { supabase } from './supabase';

export type EnsureProfileResult =
  | { error: null; profile: SupabaseProfile }
  | { error: Error; profile: null };

export async function ensureProfile(
  userId: string,
  email: string | null,
  provider: 'anonymous' | 'email' | 'google' | 'apple' = 'anonymous'
): Promise<EnsureProfileResult> {
  const payload = { id: userId, email: email ?? null, provider, updated_at: new Date().toISOString() };
  if (__DEV__) console.log('ensureProfile: upserting', { userId, email: payload.email, provider });
  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id', ignoreDuplicates: false })
    .select()
    .single();

  if (error) {
    if (__DEV__) console.log('ensureProfile: upsert failed', error.message);
    return { error: error as Error, profile: null };
  }
  if (!data) {
    return { error: new Error('No profile data'), profile: null };
  }
  return { error: null, profile: normalizeProfileRow(data) };
}

function normalizeProfileRow(row: Record<string, unknown>): SupabaseProfile {
  return {
    id: row.id as string,
    email: (row.email as string | null) ?? null,
    username: (row.username as string | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    created_at: (row.created_at as string) ?? '',
    updated_at: (row.updated_at as string) ?? '',
    last_login_at: (row.last_login_at as string | null) ?? null,
    provider: (row.provider as SupabaseProfile['provider']) ?? 'anonymous',
    is_child_account: Boolean(row.is_child_account),
    selected_avatar_id: (row.selected_avatar_id as string | null) ?? null,
    last_universe_id: (row.last_universe_id as string | null) ?? null,
    age: (row.age as number | null) ?? null,
    gender: (row.gender as 'boy' | 'girl' | null) ?? null,
    is_premium: Boolean(row.is_premium),
  };
}

export async function fetchProfile(userId: string): Promise<SupabaseProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return normalizeProfileRow(data as Record<string, unknown>);
}

export type ProfileUpdatePayload = Partial<
  Pick<
    SupabaseProfile,
    | 'username'
    | 'avatar_url'
    | 'last_login_at'
    | 'is_child_account'
    | 'selected_avatar_id'
    | 'last_universe_id'
    | 'age'
    | 'gender'
    | 'is_premium'
    | 'provider'
  >
>;

export async function updateProfile(
  userId: string,
  updates: ProfileUpdatePayload
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);
  return { error: error ?? null };
}

export async function syncLocalToProfile(
  userId: string,
  local: {
    username: string | null;
    selected_avatar_id: string | null;
    age: number | null;
    gender: 'boy' | 'girl' | null;
  }
): Promise<{ error: Error | null }> {
  return updateProfile(userId, {
    username: local.username ?? null,
    selected_avatar_id: local.selected_avatar_id ?? null,
    age: local.age ?? null,
    gender: local.gender ?? null,
  });
}

export async function touchLastLogin(userId: string): Promise<void> {
  await updateProfile(userId, { last_login_at: new Date().toISOString() });
}
